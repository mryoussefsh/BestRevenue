<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Faq;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FaqTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Clear cached permissions to avoid state leakage
        $this->app->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Create the manage_pages permission for testing authorization
        \Spatie\Permission\Models\Permission::firstOrCreate([
            'name' => 'manage_pages',
            'guard_name' => 'web'
        ]);
    }

    private function createAdminUser(): User
    {
        $admin = User::create([
            'name'      => 'Admin User',
            'email'     => 'admin@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        // Assign manage_pages permission so it passes the 'can:manage_pages' middleware
        $admin->givePermissionTo('manage_pages');

        return $admin;
    }

    private function createPublisherUser(): User
    {
        return User::create([
            'name'      => 'Publisher User',
            'email'     => 'publisher@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'publisher',
            'is_active' => true,
        ]);
    }

    public function test_public_user_can_list_only_active_faqs_sorted_properly(): void
    {
        // 5 FAQs are automatically seeded from migration
        Faq::create([
            'id' => '11111111-1111-1111-1111-111111111111',
            'question' => 'Active 2',
            'question_ar' => 'نشط 2',
            'answer' => 'Ans 2',
            'answer_ar' => 'جواب 2',
            'sort_order' => 20,
            'is_active' => true,
        ]);

        Faq::create([
            'id' => '22222222-2222-2222-2222-222222222222',
            'question' => 'Active 1',
            'question_ar' => 'نشط 1',
            'answer' => 'Ans 1',
            'answer_ar' => 'جواب 1',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        Faq::create([
            'id' => '33333333-3333-3333-3333-333333333333',
            'question' => 'Inactive FAQ',
            'answer' => 'Should not be seen',
            'sort_order' => 5,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/public/faqs');

        $response->assertStatus(200);
        
        // Assert total active count = 5 default + 2 newly created active = 7 active FAQs
        $response->assertJsonCount(7);

        // Verify ordering: The 5 default FAQs have sort_order 1 to 5.
        // Active 1 (sort_order 10) and Active 2 (sort_order 20) should be at indices 5 and 6 respectively.
        $response->assertJsonPath('5.question', 'Active 1');
        $response->assertJsonPath('6.question', 'Active 2');
    }

    public function test_admin_can_manage_faqs(): void
    {
        $admin = $this->createAdminUser();
        Sanctum::actingAs($admin);

        // Create FAQ
        $createResponse = $this->postJson('/api/v1/admin/faqs', [
            'question' => 'How to join?',
            'question_ar' => 'كيفية الانضمام؟',
            'answer' => 'Register online.',
            'answer_ar' => 'سجل عبر الإنترنت.',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201);
        $this->assertDatabaseHas('faqs', [
            'question' => 'How to join?',
            'question_ar' => 'كيفية الانضمام؟',
        ]);

        $faqId = $createResponse->json('data.id');

        // Update FAQ
        $updateResponse = $this->putJson("/api/v1/admin/faqs/{$faqId}", [
            'question' => 'How to join BestRevenue?',
            'question_ar' => 'كيفية الانضمام إلى بست ريفينيو؟',
            'answer' => 'Register online today.',
            'answer_ar' => 'سجل عبر الإنترنت اليوم.',
            'sort_order' => 15,
            'is_active' => false,
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('faqs', [
            'id' => $faqId,
            'question' => 'How to join BestRevenue?',
            'is_active' => false,
        ]);

        // List FAQ as Admin: 5 default seeded + 1 newly created = 6 FAQs total
        $listResponse = $this->getJson('/api/v1/admin/faqs');
        $listResponse->assertStatus(200);
        $listResponse->assertJsonCount(6, 'data');

        // Delete FAQ
        $deleteResponse = $this->deleteJson("/api/v1/admin/faqs/{$faqId}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('faqs', [
            'id' => $faqId,
        ]);
    }

    public function test_publisher_user_cannot_manage_faqs(): void
    {
        $publisher = $this->createPublisherUser();
        Sanctum::actingAs($publisher);

        $response = $this->postJson('/api/v1/admin/faqs', [
            'question' => 'Question?',
            'answer' => 'Answer.',
        ]);

        // Publisher does not have admin role / permissions, so it will get blocked
        $response->assertStatus(403);
    }
}
