<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed/update settings needed for support mail
        Setting::updateOrCreate(
            ['key' => 'support_email'],
            [
                'value' => 'support@bestrevenue.local',
                'group' => 'support',
                'label' => 'Support Destination & Contact Email',
                'type'  => 'string',
            ]
        );

        Setting::updateOrCreate(
            ['key' => 'site_name'],
            [
                'value' => 'BestRevenue',
                'group' => 'display',
                'label' => 'Platform Name',
                'type'  => 'string',
            ]
        );
    }

    public function test_contact_form_sends_email_successfully(): void
    {
        \Illuminate\Support\Facades\Event::fake([\Illuminate\Mail\Events\MessageSending::class]);

        $payload = [
            'name'    => 'John Doe',
            'email'   => 'john@example.com',
            'subject' => 'Issue with Banner Ads',
            'message' => 'Hello, I have an issue configuring my banner ads size settings.',
        ];

        $response = $this->postJson('/api/v1/public/contact', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Your message has been sent successfully. We will get back to you shortly!');

        \Illuminate\Support\Facades\Event::assertDispatched(\Illuminate\Mail\Events\MessageSending::class, function ($event) use ($payload) {
            $toAddresses = array_map(fn($addr) => $addr->getAddress(), $event->message->getTo());
            $replyToAddresses = array_map(fn($addr) => $addr->getAddress(), $event->message->getReplyTo());
            
            return in_array('support@bestrevenue.local', $toAddresses) &&
                   in_array($payload['email'], $replyToAddresses) &&
                   str_contains($event->message->getSubject(), 'Issue with Banner Ads');
        });
    }

    public function test_contact_form_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/public/contact', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_contact_form_validates_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/public/contact', [
            'name'    => 'John Doe',
            'email'   => 'invalid-email',
            'subject' => 'Subject',
            'message' => 'Message details',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
