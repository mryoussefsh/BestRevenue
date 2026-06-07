<?php

namespace App\Mail;

use App\Models\Publisher;

class AccountSuspendedMail extends BaseTemplateMail
{
    protected string $templateKey = 'account_suspended';

    public function __construct(Publisher $publisher)
    {
        $this->variables = [
            'name'          => $publisher->name,
            'email'         => $publisher->email,
            'site_name'     => config('app.name'),
            'login_url'     => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url' => config('app.frontend_url', 'http://localhost:5173') . '/publisher',
        ];
    }
}
