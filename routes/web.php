<?php

use Illuminate\Support\Facades\Route;

Route::group(['middleware' => ['web', 'verify.shopify']], function () {
    Route::get('/', function () {
        return view('welcome');
    })->name('home');

    Route::get('/dash', function () {
        return view('welcome', ['page' => 'dash']);
    });

    Route::get('/settings', function () {
        return view('welcome', ['page' => 'settings']);
    });
});

