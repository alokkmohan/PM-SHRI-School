<?php
/**
 * PM SHRI Network — Must-Use Plugin
 * Runs on every site load automatically.
 * Handles: login redirect, principal access control
 */

// ── 1. LOGIN REDIRECT ────────────────────────────────────────
// Principal login ke baad unki school ke admin pe bhejo
add_filter('login_redirect', function ($redirect_to, $requested_redirect, $user) {
    if (is_wp_error($user)) return $redirect_to;

    // Super admin — default WP behavior
    if (is_super_admin($user->ID)) return $redirect_to;

    // Principal ka primary blog find karo
    $primary_blog_id = (int) get_user_meta($user->ID, 'primary_blog', true);

    if ($primary_blog_id > 1) {
        // Unki school ke wp-admin pe redirect karo
        return get_admin_url($primary_blog_id);
    }

    return $redirect_to;
}, 10, 3);

// ── 2. PREVENT PRINCIPAL FROM ACCESSING WRONG SITE'S ADMIN ──
// Agar principal kisi doosri school ka admin open karne ki koshish kare
add_action('admin_init', function () {
    if (is_super_admin()) return;
    if (!is_multisite()) return;

    $current_user    = wp_get_current_user();
    if (!$current_user->ID) return;

    $current_blog_id = get_current_blog_id();
    $primary_blog_id = (int) get_user_meta($current_user->ID, 'primary_blog', true);

    // Agar user main site (blog_id=1) admin access karne ki koshish kare
    if ($current_blog_id === 1) {
        // Unhe unki school ke admin pe bhejo
        if ($primary_blog_id > 1) {
            wp_redirect(get_admin_url($primary_blog_id));
            exit;
        }
    }
});

// ── 3. FORCE CORRECT SITE CONTEXT ON LOGIN PAGE ─────────────
// wp-login.php pe bhi correct blog context set karo
add_action('login_init', function () {
    if (!is_multisite()) return;

    // Agar user already logged in hai to redirect
    $user_id = get_current_user_id();
    if (!$user_id) return;
    if (is_super_admin($user_id)) return;

    $primary_blog_id = (int) get_user_meta($user_id, 'primary_blog', true);
    if ($primary_blog_id > 1 && isset($_GET['action']) && $_GET['action'] === 'logout') return;

    if ($primary_blog_id > 1 && !isset($_POST['log'])) {
        // Already logged in — apni school ke admin pe bhejo
        wp_redirect(get_admin_url($primary_blog_id));
        exit;
    }
});

// ── 4. MULTISITE USER BLOG SYNC ─────────────────────────────
// Naya user create hone par unka primary_blog set karo
add_action('add_user_to_blog', function ($user_id, $role, $blog_id) {
    if ($role === 'administrator' && $blog_id > 1) {
        $existing = get_user_meta($user_id, 'primary_blog', true);
        if (!$existing) {
            update_user_meta($user_id, 'primary_blog', $blog_id);
            update_user_meta($user_id, 'source_domain', DOMAIN_CURRENT_SITE);
        }
    }
}, 10, 3);
