<?php

namespace App\Enums;

enum CapitalTransactionType: string
{
    case Introduction = 'introduction';
    case Withdrawal = 'withdrawal';
}
