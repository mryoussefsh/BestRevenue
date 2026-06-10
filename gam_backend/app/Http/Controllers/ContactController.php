<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class ContactController extends Controller
{
    /**
     * POST /api/v1/public/contact
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $name = $request->name;
        $email = $request->email;
        $subject = $request->subject;
        $messageText = $request->message;

        $destEmail = Setting::get('support_email', 'support@bestrevenue.local');
        $siteName = Setting::get('site_name', 'BestRevenue');

        try {
            \App\Services\MailConfigService::applyFromSettings();

            Mail::raw(
                "You have received a new contact message from the {$siteName} support form:\n\n" .
                "Sender Name: {$name}\n" .
                "Sender Email: {$email}\n" .
                "Subject: {$subject}\n\n" .
                "Message:\n{$messageText}",
                function ($msg) use ($destEmail, $subject, $name, $email, $siteName) {
                    $msg->to($destEmail)
                        ->replyTo($email, $name)
                        ->subject("[{$siteName} Support] {$subject}");
                }
            );
        } catch (\Exception $e) {
            Log::error("Failed to send contact support mail: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Your message has been sent successfully. We will get back to you shortly!'
        ]);
    }
}
