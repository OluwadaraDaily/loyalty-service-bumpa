<?php

namespace App\Events;

use App\Models\Cashback;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashbackCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public Cashback $cashback,
        public array $paymentResponse = []
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('user.'.$this->user->id),
            new Channel('cashbacks'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'cashback.completed',
            'cashback' => [
                'id' => $this->cashback->id,
                'amount' => $this->cashback->amount,
                'currency' => $this->cashback->currency,
                'status' => $this->cashback->status,
                'transaction_reference' => $this->cashback->transaction_reference,
                'paid_at' => $this->cashback->paid_at,
                'created_at' => $this->cashback->created_at,
            ],
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'message' => "Congratulations! You've received a cashback of {$this->cashback->currency} {$this->cashback->amount}",
            'payment_response' => $this->paymentResponse,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'cashback.completed';
    }
}
