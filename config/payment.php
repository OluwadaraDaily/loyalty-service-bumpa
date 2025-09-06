<?php

return [
    'mock' => [
        'success_rate' => env('PAYMENT_MOCK_SUCCESS_RATE', 0.8), // 80% success rate
        'network_timeout_rate' => env('PAYMENT_MOCK_TIMEOUT_RATE', 0.1),
        'insufficient_funds_rate' => env('PAYMENT_MOCK_INSUFFICIENT_FUNDS_RATE', 0.05),
        'processing_delay_ms' => [
            env('PAYMENT_MOCK_MIN_DELAY', 100),
            env('PAYMENT_MOCK_MAX_DELAY', 500)
        ],
    ],

    'cashback' => [
        'achievement_rates' => [
            'First Purchase' => 0.02, // 2%
            'Big Spender' => 0.05,    // 5%
            'Loyal Customer' => 0.03, // 3%
            'Weekend Warrior' => 0.04, // 4%
        ],

        'badge_multipliers' => [
            'Bronze Badge' => 1.0,
            'Silver Badge' => 1.2, // 20% bonus
            'Gold Badge' => 1.5,   // 50% bonus
            'Platinum Badge' => 2.0, // 100% bonus
        ],

        'max_cashback_amount' => env('CASHBACK_MAX_AMOUNT', 10000), // 10,000 NGN
        'min_cashback_amount' => env('CASHBACK_MIN_AMOUNT', 500),    // 500 NGN
        
        'retry' => [
            'max_attempts' => env('CASHBACK_MAX_RETRY_ATTEMPTS', 3),
            'delay_minutes' => [0, 5, 30], // immediate, 5 min, 30 min
        ],
    ]
];