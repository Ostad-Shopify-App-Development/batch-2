import Turbo from "./libs/turbo";
import {getSessionToken} from "@shopify/app-bridge/utilities";
import createApp from "@shopify/app-bridge";
import {NavigationMenu, Redirect, AppLink} from "@shopify/app-bridge/actions";
import {setupRedirectHandler} from "./navigation.js";


document.addEventListener('DOMContentLoaded', () => {
    const shopifyAppInit = document.getElementById('shopify-app-init')
    if (!shopifyAppInit) { return }
    var data = shopifyAppInit.dataset;
    if (data.forceIframe === "false") { return }

    window.app = createApp({
        apiKey: data.apiKey,
        host: data.host,
        forceRedirect: false,
    });

    console.log(data);

    const homeLink = AppLink.create(window.app, {
        label: 'Home',
        destination: '/',
    });

    const settingsLink = AppLink.create(window.app, {
        label: 'Settings',
        destination: '/settings',
    });

    const dashLink = AppLink.create(window.app, {
        label: 'Dashboard',
        destination: '/dash',
    });


    // Setup redirect handler
    const navigationMenu = NavigationMenu.create(window.app, {
        items: [
            homeLink,
            settingsLink,
            dashLink,
        ],
        active: homeLink,
    });

    navigationMenu.subscribe(NavigationMenu.Action.UPDATE, (payload) => {
        navigationMenu.set({active: payload.item});
        const redirect = Redirect.create(window.app);
        if (payload && payload.destination) {
            redirect.dispatch(Redirect.Action.APP, payload.destination);  // Navigate to the destination within the app
        } else {
            console.error('Navigation menu item is missing a destination');
        }
    });

    // Append Shopify's JWT to every Turbo request
    document.addEventListener('turbo:before-fetch-request', async (event) => {
        event.preventDefault()

        window.sessionToken = await retrieveToken();
        event.detail.fetchOptions.headers['Authorization'] = `Bearer ${window.sessionToken}`

        event.detail.resume()
    })

    // Redirect to the requested page
    //Turbo.visit("/", { action: "replace" });

    document.addEventListener("turbo:load", () => {
        const shopifyAppInit = document.getElementById('shopify-app-init')
        if (!shopifyAppInit) { return }
        const data = shopifyAppInit.dataset;
        const jwtExpireAt = data.jwtExpireAt;

        if (window.sessionToken && jwtExpireAt) {
            // Convert jwtExpireAt to milliseconds
            window.jwtExpireAt = jwtExpireAt * 1000;
        }
    });

    setupRedirectHandler()
});



export async function retrieveToken() {
    if (window.sessionToken && window.jwtExpireAt && window.jwtExpireAt > Date.now()) {
        const diff = parseInt((window.jwtExpireAt - Date.now()) / 1000) + 's';
        console.log('[shopify_app] Reusing token. Expires in:', diff);
        return window.sessionToken;
    } else {
        console.log('[shopify_app] Get new token');
        return await getSessionToken(window.app);
    }
}

// Force redirect via turbo using turbo_redirect_to helper in controller.
// Mandatory for Safari since it's loosing JWT token during 302 redirect.
document.addEventListener("turbo:before-fetch-response", (event) => {
    const response = event.detail.fetchResponse;
    const status = response.statusCode;
    const location = response.header("Location");

    if (status === 200 && location !== null) {
        event.preventDefault();
        Turbo.visit(location);
    }
});
