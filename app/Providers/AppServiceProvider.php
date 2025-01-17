<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $shopDomain = request()->get('shop');
        Facades\View::composer('partials.appbridge-data', function ($view) use ($shopDomain) {

            $view->with([
                'apiKey' => \Osiset\ShopifyApp\Util::getShopifyConfig('api_key', $shopDomain ?? Auth::user()->name ),
                'shopOrigin' => request()->get('shop'),
                'host' => request()->get('host'),
                'forceRedirect' => true,
                'loadPath' => '/',
                'expireAt' => $this->getExpireAt(),
            ]);
        });
    }

    protected function getExpireAt()
    {
        $bearerToken = request()->bearerToken();

        if (!$bearerToken) {
            return "";
        }
        // JWT has three parts separated by dots (header.payload.signature)
        $tokenParts = explode('.', $bearerToken);

        if (count($tokenParts) == 3) {
            // Decode the payload (second part)
            $payload = base64_decode($tokenParts[1]);

            // Convert the payload to an associative array
            $payloadArray = json_decode($payload, true);

            return $payloadArray['exp'] ?? "";
            // Access the 'exp' claim (expiration time)
        }
    }
}
