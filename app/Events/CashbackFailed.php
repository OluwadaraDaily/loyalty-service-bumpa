<?php

namespace App\Events;

use App\Models\Cashback;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashbackFailed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Cashback $cashback,
        public string $reason,
        public bool $willRetry = false
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->user->id),
            new Channel('cashbacks')
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'cashback.failed',
            'cashback' => [
                'id' => $this->cashback->id,
                'amount' => $this->cashback->amount,
                'currency' => $this->cashback->currency,
                'status' => $this->cashback->status,
                'retry_count' => $this->cashback->retry_count,
                'failure_reason' => $this->cashback->failure_reason,
                'created_at' => $this->cashback->created_at
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email
            ],
            'reason' => $this->reason,
            'will_retry' => $this->willRetry,
            'message' => $this->willRetry 
                ? "Your cashback payment is being retried. We'll notify you once it's processed."
                : "We encountered an issue processing your cashback. Our team has been notified.",
            'timestamp' => now()->toISOString()
        ];
    }

    public function broadcastAs(): string
    {
        return 'cashback.failed';
    }
}