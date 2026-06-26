<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageFallbackTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Ensure local driver writes to the test environment storage directory
        Storage::fake('public');
    }

    public function test_storage_fallback_serves_existing_files(): void
    {
        // 1. Create a fake file in the public storage
        Storage::disk('public')->put('settings/test_logo.png', 'fake-image-bytes-here');

        // 2. Request the file through the fallback route
        $response = $this->get('/storage/settings/test_logo.png');
        // 3. Verify it returns 200 and correct content
        $response->assertStatus(200);
        $this->assertEquals(
            realpath(Storage::disk('public')->path('settings/test_logo.png')),
            $response->getFile()->getPathname()
        );
    }

    public function test_storage_fallback_returns_404_for_non_existent_files(): void
    {
        // Request a file that does not exist
        $response = $this->get('/storage/settings/does_not_exist.png');

        $response->assertStatus(404);
    }

    public function test_storage_fallback_prevents_directory_traversal(): void
    {
        // 1. Try directory traversal with parent dots in URL path
        $response1 = $this->get('/storage/../../.env');
        $response1->assertStatus(404);

        // 2. Try with encoded or hidden path segments
        $response2 = $this->get('/storage/settings/%2e%2e%2f%2e%2e%2f.env');
        $response2->assertStatus(404);
    }
}
