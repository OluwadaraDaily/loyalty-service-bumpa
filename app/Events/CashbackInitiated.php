<?php

namespace App\Events;

use App\Models\Cashback;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashbackInitiated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Cashback $cashback
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
            'event' => 'cashback.initiated',
            'cashback' => [
                'id' => $this->cashback->id,
                'amount' => $this->cashback->amount,
                'currency' => $this->cashback->currency,
                'status' => $this->cashback->status,
                'idempotency_key' => $this->cashback->idempotency_key,
                'created_at' => $this->cashback->created_at
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email
            ],
            'timestamp' => now()->toISOString()
        ];
    }

    public function broadcastAs(): string
    {
        return 'cashback.initiated';
    }
}