<?php

namespace App\Mail;

use App\Models\Publisher;

class PasswordResetMail extends BaseTemplateMail
{
    protected string $templateKey = 'password_reset';

    public function __construct(Publisher $publisher, string $resetLink)
    {
        $this->variables = [
            'name'          => $publisher->name,
            'email'         => $publisher->email,
            'site_name'     => config('app.name'),
            'reset_link'    => $resetLink,
            'login_url'     => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url' => config('app.frontend_url', 'http://localhost:5173') . '/publisher',
        ];
    }
}
