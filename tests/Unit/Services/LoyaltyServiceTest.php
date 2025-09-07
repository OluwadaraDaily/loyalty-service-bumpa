<?php

namespace Tests\Unit\Services;

use App\Events\AchievementUnlocked;
use App\Events\BadgeUnlocked;
use App\Models\Achievement;
use App\Models\Badge;
use App\Models\Purchase;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserBadge;
use App\Services\CashbackService;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class LoyaltyServiceTest extends TestCase
{
    use RefreshDatabase;

    private LoyaltyService $loyaltyService;
    private User $user;
    private CashbackService $mockCashbackService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockCashbackService = $this->createMock(CashbackService::class);
        $this->loyaltyService = new LoyaltyService($this->mockCashbackService);
        $this->user = User::factory()->create();
        
        Event::fake();
    }

    /** @test */
    public function it_processes_purchase_event_successfully()
    {
        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'test_ref_123',
            'status' => 'completed',
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('purchase_id', $result);
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'test_ref_123'
        ]);
    }

    /** @test */
    public function it_fails_when_user_not_found()
    {
        $purchaseData = [
            'user_id' => 99999, // Non-existent user
            'amount' => 100.00
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        $this->assertFalse($result['success']);
        $this->assertEquals('User not found', $result['error']);
        $this->assertEquals([], $result['newly_unlocked_achievements']);
        $this->assertEquals([], $result['newly_unlocked_badges']);
    }

    /** @test */
    public function it_unlocks_first_purchase_achievement()
    {
        Achievement::factory()->firstPurchase()->create();
        
        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        Event::assertDispatched(AchievementUnlocked::class, function ($event) {
            return $event->user->id === $this->user->id &&
                   $event->achievement->name === 'First Purchase';
        });
        
        $this->assertCount(1, $result['newly_unlocked_achievements']);
        $this->assertEquals('First Purchase', $result['newly_unlocked_achievements'][0]->name);
    }

    /** @test */
    public function it_calculates_big_spender_achievement_progress()
    {
        $achievement = Achievement::factory()->bigSpender()->create();
        
        // Create some existing purchases
        Purchase::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'amount' => 200
        ]);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 400
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        // Total should be 1000 (3 × 200 + 400)
        $userAchievement = UserAchievement::where([
            'user_id' => $this->user->id,
            'achievement_id' => $achievement->id
        ])->first();

        $this->assertEquals(1000, $userAchievement->progress);
        $this->assertTrue($userAchievement->unlocked);
    }

    /** @test */
    public function it_calculates_weekend_warrior_achievement()
    {
        $achievement = Achievement::factory()->weekendWarrior()->create();
        
        // Create weekend purchases (Saturday and Sunday)
        Purchase::factory()->weekend()->create(['user_id' => $this->user->id]);
        Purchase::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->startOfWeek()->addDays(6) // Sunday
        ]);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100
        ];

        // Simulate processing on Sunday
        $this->travel(now()->startOfWeek()->addDays(6));
        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        $userAchievement = UserAchievement::where([
            'user_id' => $this->user->id,
            'achievement_id' => $achievement->id
        ])->first();

        $this->assertEquals(3, $userAchievement->progress);
        $this->assertTrue($userAchievement->unlocked);
    }

    /** @test */
    public function it_unlocks_badges_when_required_achievements_completed()
    {
        $achievement = Achievement::factory()->firstPurchase()->create();
        $badge = Badge::factory()->create();
        
        // Link achievement to badge
        $badge->achievements()->attach($achievement->id);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        Event::assertDispatched(BadgeUnlocked::class, function ($event) use ($badge) {
            return $event->user->id === $this->user->id &&
                   $event->badge->id === $badge->id;
        });

        $this->assertCount(1, $result['newly_unlocked_badges']);
    }

    /** @test */
    public function it_calculates_badge_progress_percentage()
    {
        $achievement1 = Achievement::factory()->firstPurchase()->create();
        $achievement2 = Achievement::factory()->create(['points_required' => 1]);
        $badge = Badge::factory()->create();
        
        $badge->achievements()->attach([$achievement1->id, $achievement2->id]);

        // Unlock only first achievement
        UserAchievement::create([
            'user_id' => $this->user->id,
            'achievement_id' => $achievement1->id,
            'progress' => 1,
            'unlocked' => true
        ]);

        $badgeProgress = $this->loyaltyService->getUserBadgeProgress($this->user);
        $thisBadgeProgress = collect($badgeProgress)->firstWhere('id', $badge->id);

        // Should be 50% progress (1 out of 2 achievements)
        $this->assertEquals(50.0, $thisBadgeProgress['progress_percentage']);
        $this->assertEquals(1, $thisBadgeProgress['completed_achievements']);
        $this->assertEquals(2, $thisBadgeProgress['required_achievements']);
    }

    /** @test */
    public function it_handles_database_transaction_rollback_on_error()
    {
        $this->mockCashbackService->method('processCashbackForPurchase')
                                 ->willThrowException(new \Exception('Payment failed'));

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $this->expectException(\Exception::class);
        $this->loyaltyService->processPurchaseEvent($purchaseData);

        // Verify no purchase was created due to rollback
        $this->assertDatabaseMissing('purchases', [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ]);
    }

    /** @test */
    public function it_does_not_unlock_already_unlocked_achievements()
    {
        $achievement = Achievement::factory()->firstPurchase()->create();
        
        // Pre-unlock the achievement
        UserAchievement::create([
            'user_id' => $this->user->id,
            'achievement_id' => $achievement->id,
            'progress' => 1,
            'unlocked' => true,
            'unlocked_at' => now()->subHour()
        ]);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        // Should not dispatch event for already unlocked achievement
        Event::assertNotDispatched(AchievementUnlocked::class);
        $this->assertCount(0, $result['newly_unlocked_achievements']);
    }

    /** @test */
    public function it_calls_cashback_service_for_eligible_purchase()
    {
        $this->mockCashbackService
            ->expects($this->once())
            ->method('processCashbackForPurchase')
            ->with($this->user, $this->isInstanceOf(Purchase::class), [], []);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $this->loyaltyService->processPurchaseEvent($purchaseData);
    }

    /** @test */
    public function it_updates_achievement_progress_without_unlocking()
    {
        $achievement = Achievement::factory()->loyalCustomer()->create();
        
        // Create some existing purchases (less than required 10)
        Purchase::factory()->count(5)->create(['user_id' => $this->user->id]);

        $purchaseData = [
            'user_id' => $this->user->id,
            'amount' => 100.00
        ];

        $result = $this->loyaltyService->processPurchaseEvent($purchaseData);

        $userAchievement = UserAchievement::where([
            'user_id' => $this->user->id,
            'achievement_id' => $achievement->id
        ])->first();

        // Should be 6 purchases total, but not unlocked (needs 10)
        $this->assertEquals(6, $userAchievement->progress);
        $this->assertFalse($userAchievement->unlocked);
        $this->assertCount(0, $result['newly_unlocked_achievements']);
    }
}