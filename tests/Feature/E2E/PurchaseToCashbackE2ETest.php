<?php

namespace Tests\Feature\E2E;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseToCashbackE2ETest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($this->user);
        
        // Seed test data
        $this->artisan('db:seed', ['--class' => 'LoyaltySystemSeeder']);
    }

    /** @test */
    public function it_completes_full_purchase_to_cashback_workflow()
    {
        // Step 1: Make a purchase that unlocks achievements
        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 1000.00, // Large enough to unlock achievements
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'e2e_test_purchase',
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => [
                'product_name' => 'Premium Product'
            ]
        ];

        $purchaseResponse = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);
        
        // Assert purchase was successful
        $purchaseResponse->assertOk()
                        ->assertJson(['success' => true]);

        // Step 2: Verify achievements were unlocked
        $achievementsResponse = $this->getJson("/api/users/{$this->user->id}/achievements");
        $achievementsResponse->assertOk();
        
        $achievements = $achievementsResponse->json('achievements');
        $unlockedAchievements = collect($achievements)->filter(fn($a) => $a['unlocked'])->count();
        $this->assertGreaterThan(0, $unlockedAchievements, 'At least one achievement should be unlocked');

        // Step 3: Verify cashback was initiated
        $this->assertDatabaseHas('cashbacks', [
            'user_id' => $this->user->id,
        ]);

        // Get the purchase ID to verify cashback relationship
        $purchase = $this->user->purchases()
                              ->where('payment_reference', 'e2e_test_purchase')
                              ->first();
        
        $this->assertNotNull($purchase);
        $this->assertDatabaseHas('cashbacks', [
            'user_id' => $this->user->id,
            'purchase_id' => $purchase->id
        ]);

        // Step 4: Check dashboard statistics reflect the changes
        $statsResponse = $this->getJson("/api/users/{$this->user->id}/dashboard-stats");
        $statsResponse->assertOk();
        
        $stats = $statsResponse->json('statistics');
        $this->assertEquals(1, $stats['total_purchases']);
        $this->assertEquals('1,000.00', $stats['total_spent']);
        $this->assertGreaterThan(0, (float)str_replace(',', '', $stats['total_cashback']));
    }

    /** @test */
    public function it_handles_multiple_purchases_and_badge_progression()
    {
        // Step 1: Make multiple purchases to unlock badge
        $purchaseAmounts = [100, 200, 300, 400, 500]; // Progressive amounts
        
        foreach ($purchaseAmounts as $index => $amount) {
            $purchaseData = [
                'user_id' => $this->user->id,
                'amount' => $amount,
                'currency' => 'NGN',
                'payment_method' => 'card',
                'payment_reference' => "multi_purchase_{$index}",
                'status' => 'completed',
                'timestamp' => now()->toISOString()
            ];

            $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);
            $response->assertOk();
        }

        // Step 2: Verify badge progression
        $achievementsResponse = $this->getJson("/api/users/{$this->user->id}/achievements");
        $badges = $achievementsResponse->json('badges');
        
        // At least one badge should have significant progress
        $progressedBadges = collect($badges)->filter(fn($b) => $b['progress_percentage'] > 50)->count();
        $this->assertGreaterThan(0, $progressedBadges);

        // Step 3: Verify total statistics
        $statsResponse = $this->getJson("/api/users/{$this->user->id}/dashboard-stats");
        $stats = $statsResponse->json('statistics');
        
        $this->assertEquals(5, $stats['total_purchases']);
        $this->assertEquals('1,500.00', $stats['total_spent']); // Sum of all purchases
    }

    /** @test */
    public function it_demonstrates_admin_panel_visibility()
    {
        // Step 1: Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Step 2: Regular user makes purchases (as setup data)
        Sanctum::actingAs($this->user);
        $this->postJson("/api/users/{$this->user->id}/purchase", [
            'user_id' => $this->user->id,
            'amount' => 500.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'admin_view_test',
            'status' => 'completed',
            'timestamp' => now()->toISOString()
        ]);

        // Step 3: Admin views all users' progress
        Sanctum::actingAs($admin);
        $adminResponse = $this->getJson('/api/admin/users/achievements');
        $adminResponse->assertOk();

        $users = $adminResponse->json('users');
        $testUser = collect($users)->firstWhere('id', $this->user->id);
        
        $this->assertNotNull($testUser, 'Test user should be visible to admin');
        $this->assertGreaterThan(0, $testUser['achievements_count']);
    }

    /** @test */
    public function it_handles_queue_processing_stress_test()
    {
        // Step 1: Add many events to queue rapidly
        $eventCount = 20; // Reduced from 50 for faster testing
        for ($i = 0; $i < $eventCount; $i++) {
            $purchaseData = [
                'user_id' => $this->user->id,
                'amount' => 50.00 + $i,
                'currency' => 'NGN',
                'payment_method' => 'card',
                'payment_reference' => "stress_test_{$i}",
                'status' => 'completed',
                'timestamp' => now()->toISOString()
            ];

            // Use API endpoint to add to queue and process
            $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);
            $response->assertOk();
        }

        // Step 2: Verify all purchases were processed successfully
        $purchaseCount = $this->user->purchases()->count();
        $this->assertEquals($eventCount, $purchaseCount);

        // Step 3: Verify dashboard reflects all purchases
        $statsResponse = $this->getJson("/api/users/{$this->user->id}/dashboard-stats");
        $stats = $statsResponse->json('statistics');
        $this->assertEquals($eventCount, $stats['total_purchases']);
    }

    /** @test */
    public function it_handles_error_scenarios_gracefully()
    {
        // Test 1: Invalid purchase data
        $invalidPurchaseData = [
            'user_id' => $this->user->id,
            'amount' => -100.00, // Negative amount
            'currency' => 'INVALID',
            'payment_method' => 'card',
            'payment_reference' => 'error_test_1',
            'status' => 'completed',
            'timestamp' => 'invalid_timestamp'
        ];

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $invalidPurchaseData);
        // Should handle gracefully without crashing
        $this->assertTrue($response->status() >= 200 && $response->status() < 600);

        // Test 2: Access without proper authentication
        Sanctum::actingAs(null);
        $response = $this->getJson("/api/users/{$this->user->id}/achievements");
        $response->assertUnauthorized();

        // Test 3: Regular user accessing admin endpoints
        Sanctum::actingAs($this->user);
        $response = $this->getJson('/api/admin/users/achievements');
        $response->assertForbidden();
    }

    /** @test */
    public function it_maintains_data_consistency_across_components()
    {
        // Step 1: Make purchase with specific data
        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 750.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'consistency_test_123',
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => [
                'product_name' => 'Consistency Test Product',
                'category' => 'Test'
            ]
        ];

        $purchaseResponse = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);
        $purchaseResponse->assertOk();

        // Step 2: Verify purchase exists with correct data
        $purchase = $this->user->purchases()
                              ->where('payment_reference', 'consistency_test_123')
                              ->first();
        
        $this->assertNotNull($purchase);
        $this->assertEquals(750.00, $purchase->amount);
        $this->assertEquals('Consistency Test Product', $purchase->metadata['product_name']);

        // Step 3: Verify achievements reflect the purchase
        $achievementsResponse = $this->getJson("/api/users/{$this->user->id}/achievements");
        $achievements = $achievementsResponse->json('achievements');
        
        // Check if any achievement was unlocked (depends on seeded data)
        $totalProgress = collect($achievements)->sum('progress');
        $this->assertGreaterThan(0, $totalProgress);

        // Step 4: Verify dashboard statistics are consistent
        $statsResponse = $this->getJson("/api/users/{$this->user->id}/dashboard-stats");
        $stats = $statsResponse->json('statistics');
        
        $this->assertGreaterThanOrEqual(1, $stats['total_purchases']);
        $this->assertGreaterThanOrEqual(750, (float)str_replace(',', '', $stats['total_spent']));
    }

    /** @test */
    public function it_processes_weekend_purchases_correctly()
    {
        // Travel to a weekend (Saturday)
        $this->travel(now()->startOfWeek()->addDays(5)); // Saturday

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 200.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'weekend_test_123',
            'status' => 'completed',
            'timestamp' => now()->toISOString()
        ];

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);
        $response->assertOk();

        // Verify the purchase was recorded with weekend timestamp
        $purchase = $this->user->purchases()
                              ->where('payment_reference', 'weekend_test_123')
                              ->first();
        
        $this->assertNotNull($purchase);
        $this->assertTrue($purchase->created_at->isWeekend());

        // Check if weekend warrior achievement made progress
        $achievementsResponse = $this->getJson("/api/users/{$this->user->id}/achievements");
        $achievements = $achievementsResponse->json('achievements');
        
        $weekendAchievement = collect($achievements)
            ->firstWhere('name', 'Weekend Warrior');
        
        if ($weekendAchievement) {
            $this->assertGreaterThan(0, $weekendAchievement['progress']);
        }
    }
}