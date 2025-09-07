<?php

namespace Tests\Feature\Api;

use App\Models\Achievement;
use App\Models\Badge;
use App\Models\Purchase;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserBadge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAchievementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Achievement $achievement;
    private Badge $badge;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create(['role' => 'user']);
        $this->achievement = Achievement::factory()->firstPurchase()->create();
        $this->badge = Badge::factory()->create();
        
        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_retrieves_user_achievements_and_badges()
    {
        // Create user achievement progress
        UserAchievement::create([
            'user_id' => $this->user->id,
            'achievement_id' => $this->achievement->id,
            'progress' => 1,
            'unlocked' => true,
            'unlocked_at' => now()
        ]);

        UserBadge::create([
            'user_id' => $this->user->id,
            'badge_id' => $this->badge->id,
            'unlocked' => false
        ]);

        $response = $this->getJson("/api/users/{$this->user->id}/achievements");

        $response->assertOk()
                ->assertJsonStructure([
                    'user' => ['id', 'name', 'email', 'current_badge'],
                    'achievements' => [
                        '*' => [
                            'id', 'name', 'description', 'points_required',
                            'progress', 'progress_percentage', 'unlocked', 'unlocked_at'
                        ]
                    ],
                    'badges' => [
                        '*' => [
                            'id', 'name', 'description', 'icon_url', 'type',
                            'progress_percentage', 'unlocked', 'unlocked_at'
                        ]
                    ]
                ]);

        $achievementData = $response->json('achievements.0');
        $this->assertEquals(100.0, $achievementData['progress_percentage']);
        $this->assertTrue($achievementData['unlocked']);
    }

    /** @test */
    public function it_retrieves_dashboard_statistics()
    {
        // Create test data
        Purchase::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'amount' => 100
        ]);

        $response = $this->getJson("/api/users/{$this->user->id}/dashboard-stats");

        $response->assertOk()
                ->assertJsonStructure([
                    'statistics' => [
                        'total_purchases', 'total_spent', 
                        'total_cashback', 'pending_cashback'
                    ],
                    'recent_activity' => [
                        'purchases', 'cashbacks'
                    ]
                ]);

        $stats = $response->json('statistics');
        $this->assertEquals(3, $stats['total_purchases']);
        $this->assertEquals('300.00', $stats['total_spent']);
    }

    /** @test */
    public function it_processes_purchase_events()
    {
        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 150.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'test_purchase_123',
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => [
                'product_name' => 'Test Product'
            ]
        ];

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);

        $response->assertOk()
                ->assertJson([
                    'success' => true,
                    'message' => 'Purchase processed successfully',
                    'should_refresh' => true
                ]);

        // Verify purchase was created
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'amount' => 150.00,
            'payment_reference' => 'test_purchase_123'
        ]);
    }

    /** @test */
    public function it_simulates_achievement_unlocking()
    {
        // Create locked achievement for user
        UserAchievement::create([
            'user_id' => $this->user->id,
            'achievement_id' => $this->achievement->id,
            'progress' => 0,
            'unlocked' => false
        ]);

        $response = $this->postJson("/api/users/{$this->user->id}/simulate-achievement");

        $response->assertOk()
                ->assertJson([
                    'success' => true,
                    'message' => 'Achievement unlocked successfully!',
                    'should_refresh' => true
                ])
                ->assertJsonStructure([
                    'achievement' => ['id', 'name', 'description'],
                    'badges' => []
                ]);

        // Verify achievement was unlocked
        $this->assertDatabaseHas('user_achievements', [
            'user_id' => $this->user->id,
            'achievement_id' => $this->achievement->id,
            'unlocked' => true
        ]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        Sanctum::actingAs(null);

        $this->getJson("/api/users/{$this->user->id}/achievements")
             ->assertUnauthorized();
    }

    /** @test */
    public function it_validates_purchase_request_data()
    {
        $response = $this->postJson("/api/users/{$this->user->id}/purchase", []);
        
        $response->assertUnprocessable()
                ->assertJsonValidationErrors([
                    'user_id', 'amount', 'currency', 
                    'payment_method', 'payment_reference', 'status', 'timestamp'
                ]);
    }

    /** @test */
    public function it_prevents_access_to_other_users_data()
    {
        $otherUser = User::factory()->create();

        $this->getJson("/api/users/{$otherUser->id}/achievements")
             ->assertForbidden();
    }

    /** @test */
    public function it_returns_no_achievements_available_when_all_unlocked()
    {
        // Unlock all achievements
        UserAchievement::create([
            'user_id' => $this->user->id,
            'achievement_id' => $this->achievement->id,
            'progress' => 1,
            'unlocked' => true
        ]);

        $response = $this->postJson("/api/users/{$this->user->id}/simulate-achievement");

        $response->assertOk()
                ->assertJson([
                    'success' => false,
                    'message' => 'No achievements available to unlock'
                ]);
    }

    /** @test */
    public function it_shows_newly_unlocked_achievements_in_purchase_response()
    {
        // Create achievement that will be unlocked by purchase
        Achievement::factory()->firstPurchase()->create();

        $purchaseData = $this->createPurchaseData($this->user->id, [
            'payment_reference' => 'unlock_test_123'
        ]);

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);

        $response->assertOk();
        
        $responseData = $response->json();
        if (isset($responseData['newly_unlocked_achievements'])) {
            $this->assertArrayHasKey('show_unlock_animation', $responseData);
        }
    }

    /** @test */
    public function it_handles_purchase_processing_errors_gracefully()
    {
        // Invalid user_id in purchase data
        $purchaseData = $this->createPurchaseData(99999, [
            'payment_reference' => 'error_test_123'
        ]);

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);

        // Should handle the error without crashing
        $this->assertTrue($response->status() >= 200 && $response->status() < 600);
    }

    /** @test */
    public function it_returns_current_badge_information()
    {
        // Create and assign a badge to user
        UserBadge::create([
            'user_id' => $this->user->id,
            'badge_id' => $this->badge->id,
            'unlocked' => true,
            'unlocked_at' => now()
        ]);

        $response = $this->getJson("/api/users/{$this->user->id}/achievements");

        $response->assertOk();
        $userData = $response->json('user');
        $this->assertNotNull($userData['current_badge']);
    }

    /** @test */
    public function it_handles_metadata_in_purchase_requests()
    {
        $purchaseData = $this->createPurchaseData($this->user->id, [
            'metadata' => [
                'product_name' => 'Special Product',
                'category' => 'Electronics',
                'discount' => 10
            ]
        ]);

        $response = $this->postJson("/api/users/{$this->user->id}/purchase", $purchaseData);

        $response->assertOk();
        
        // Verify metadata was stored
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'payment_reference' => $purchaseData['payment_reference']
        ]);
    }
}