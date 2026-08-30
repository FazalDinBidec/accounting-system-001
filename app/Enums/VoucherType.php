<?php

namespace App\Enums;

enum VoucherType: string
{
    case Receipt = 'receipt';
    case Payment = 'payment';
}
