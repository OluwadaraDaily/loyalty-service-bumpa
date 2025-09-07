<?php

namespace Tests\Feature\Api;

use App\Models\Achievement;
use App\Models\Badge;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserBadge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAchievementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->regularUser = User::factory()->create(['role' => 'user']);
        
        // Create test achievements and badges
        Achievement::factory()->count(3)->create();
        Badge::factory()->count(2)->create();
    }

    /** @test */
    public function it_retrieves_all_users_achievements_for_admin()
    {
        Sanctum::actingAs($this->admin);

        // Create some user progress
        $achievement = Achievement::first();
        UserAchievement::create([
            'user_id' => $this->regularUser->id,
            'achievement_id' => $achievement->id,
            'progress' => $achievement->points_required,
            'unlocked' => true
        ]);

        $response = $this->getJson('/api/admin/users/achievements');

        $response->assertOk()
                ->assertJsonStructure([
                    'users' => [
                        '*' => [
                            'id', 'name', 'email',
                            'achievements_count', 'badges_count',
                            'current_badge', 'total_achievements', 'total_badges'
                        ]
                    ],
                    'summary' => [
                        'total_users', 'total_achievements_unlocked', 'total_badges_unlocked'
                    ]
                ]);

        // Verify user data is included
        $userData = collect($response->json('users'))->firstWhere('id', $this->regularUser->id);
        $this->assertNotNull($userData);
        $this->assertEquals(1, $userData['achievements_count']);
    }

    /** @test */
    public function it_requires_admin_role()
    {
        Sanctum::actingAs($this->regularUser);

        $this->getJson('/api/admin/users/achievements')
             ->assertForbidden();
    }

    /** @test */
    public function it_requires_authentication_for_admin_endpoints()
    {
        $this->getJson('/api/admin/users/achievements')
             ->assertUnauthorized();
    }

    /** @test */
    public function it_provides_comprehensive_user_statistics()
    {
        Sanctum::actingAs($this->admin);
        
        // Create multiple users with different progress
        $users = User::factory()->count(3)->create(['role' => 'user']);
        $achievements = Achievement::all();
        
        $totalAchievementsUnlocked = 0;
        
        foreach ($users as $index => $user) {
            // Give each user different numbers of achievements
            $achievementsToUnlock = $achievements->take($index + 1);
            foreach ($achievementsToUnlock as $achievement) {
                UserAchievement::create([
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'progress' => $achievement->points_required,
                    'unlocked' => true
                ]);
                $totalAchievementsUnlocked++;
            }
        }

        $response = $this->getJson('/api/admin/users/achievements');

        // Assert summary statistics
        $summary = $response->json('summary');
        $this->assertEquals(4, $summary['total_users']); // 3 created + 1 regularUser
        $this->assertEquals($totalAchievementsUnlocked, $summary['total_achievements_unlocked']);
    }

    /** @test */
    public function it_shows_users_current_badges()
    {
        Sanctum::actingAs($this->admin);
        
        $badge = Badge::first();
        UserBadge::create([
            'user_id' => $this->regularUser->id,
            'badge_id' => $badge->id,
            'unlocked' => true,
            'unlocked_at' => now()
        ]);

        $response = $this->getJson('/api/admin/users/achievements');

        $userData = collect($response->json('users'))->firstWhere('id', $this->regularUser->id);
        $this->assertNotNull($userData['current_badge']);
    }

    /** @test */
    public function it_includes_users_with_no_progress()
    {
        Sanctum::actingAs($this->admin);
        
        // Create user with no achievements or badges
        $newUser = User::factory()->create(['role' => 'user']);

        $response = $this->getJson('/api/admin/users/achievements');

        $userData = collect($response->json('users'))->firstWhere('id', $newUser->id);
        $this->assertNotNull($userData);
        $this->assertEquals(0, $userData['achievements_count']);
        $this->assertEquals(0, $userData['badges_count']);
    }

    /** @test */
    public function it_excludes_admin_users_from_regular_user_statistics()
    {
        Sanctum::actingAs($this->admin);
        
        // Create another admin user
        $anotherAdmin = User::factory()->create(['role' => 'admin']);
        
        // Give the admin user some achievements
        $achievement = Achievement::first();
        UserAchievement::create([
            'user_id' => $anotherAdmin->id,
            'achievement_id' => $achievement->id,
            'progress' => $achievement->points_required,
            'unlocked' => true
        ]);

        $response = $this->getJson('/api/admin/users/achievements');

        $users = $response->json('users');
        $adminInResults = collect($users)->firstWhere('id', $anotherAdmin->id);
        
        // Admin users should not be included in regular user statistics
        $this->assertNull($adminInResults);
    }

    /** @test */
    public function it_calculates_summary_statistics_correctly()
    {
        Sanctum::actingAs($this->admin);
        
        // Create specific test scenario
        $user1 = User::factory()->create(['role' => 'user']);
        $user2 = User::factory()->create(['role' => 'user']);
        
        $achievement1 = Achievement::first();
        $achievement2 = Achievement::skip(1)->first();
        $badge1 = Badge::first();

        // User1: 1 achievement, 1 badge
        UserAchievement::create([
            'user_id' => $user1->id,
            'achievement_id' => $achievement1->id,
            'progress' => $achievement1->points_required,
            'unlocked' => true
        ]);
        
        UserBadge::create([
            'user_id' => $user1->id,
            'badge_id' => $badge1->id,
            'unlocked' => true
        ]);

        // User2: 2 achievements, 0 badges
        UserAchievement::create([
            'user_id' => $user2->id,
            'achievement_id' => $achievement1->id,
            'progress' => $achievement1->points_required,
            'unlocked' => true
        ]);
        
        UserAchievement::create([
            'user_id' => $user2->id,
            'achievement_id' => $achievement2->id,
            'progress' => $achievement2->points_required,
            'unlocked' => true
        ]);

        $response = $this->getJson('/api/admin/users/achievements');

        $summary = $response->json('summary');
        $this->assertEquals(3, $summary['total_users']); // user1, user2, regularUser
        $this->assertEquals(3, $summary['total_achievements_unlocked']); // 1 + 2
        $this->assertEquals(1, $summary['total_badges_unlocked']); // 1 + 0
    }

    /** @test */
    public function it_handles_empty_database_gracefully()
    {
        Sanctum::actingAs($this->admin);
        
        // Remove the regular user to have minimal data
        $this->regularUser->delete();

        $response = $this->getJson('/api/admin/users/achievements');

        $response->assertOk();
        $summary = $response->json('summary');
        $this->assertEquals(0, $summary['total_users']);
        $this->assertEquals(0, $summary['total_achievements_unlocked']);
        $this->assertEquals(0, $summary['total_badges_unlocked']);
    }

    /** @test */
    public function it_returns_users_in_consistent_order()
    {
        Sanctum::actingAs($this->admin);
        
        // Create users with predictable names for sorting
        $userA = User::factory()->create(['role' => 'user', 'name' => 'Alice']);
        $userB = User::factory()->create(['role' => 'user', 'name' => 'Bob']);
        $userC = User::factory()->create(['role' => 'user', 'name' => 'Charlie']);

        $response = $this->getJson('/api/admin/users/achievements');

        $users = $response->json('users');
        $this->assertIsArray($users);
        $this->assertGreaterThan(0, count($users));
        
        // Should return consistent results on multiple calls
        $response2 = $this->getJson('/api/admin/users/achievements');
        $this->assertEquals($users, $response2->json('users'));
    }

    /** @test */
    public function it_handles_partial_achievement_progress()
    {
        Sanctum::actingAs($this->admin);
        
        $achievement = Achievement::first();
        
        // Create partial progress (not unlocked)
        UserAchievement::create([
            'user_id' => $this->regularUser->id,
            'achievement_id' => $achievement->id,
            'progress' => $achievement->points_required - 1, // Almost there
            'unlocked' => false
        ]);

        $response = $this->getJson('/api/admin/users/achievements');

        $userData = collect($response->json('users'))->firstWhere('id', $this->regularUser->id);
        $this->assertEquals(0, $userData['achievements_count']); // Should only count unlocked
    }
}