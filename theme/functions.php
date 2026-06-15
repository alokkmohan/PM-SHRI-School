<?php
/**
 * PM SHRI School Theme — functions.php
 * Child of Astra | UP Shiksha Vibhag
 */

// Enqueue parent + child styles
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('astra-parent', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('pmshri-child', get_stylesheet_uri(), ['astra-parent']);
});

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo', ['height' => 80, 'width' => 200, 'flex-height' => true, 'flex-width' => true]);
    add_theme_support('align-wide');
    add_theme_support('wp-block-styles');
});

register_nav_menus(['primary' => 'Primary Navigation', 'footer' => 'Footer Links']);

// ── SHORTCODES ──────────────────────────────────────────────

add_shortcode('pmshri_hero', function ($atts) {
    $a = shortcode_atts(['title' => get_bloginfo('name'), 'subtitle' => get_bloginfo('description')], $atts);
    return '<div class="pmshri-hero"><h1>' . esc_html($a['title']) . '</h1><p>' . esc_html($a['subtitle']) . '</p></div>';
});

add_shortcode('pmshri_stats', function ($atts) {
    $a = shortcode_atts(['students' => '800+', 'teachers' => '32', 'classes' => '12', 'estd' => '1975'], $atts);
    return '<div class="pmshri-cards">
      <div class="pmshri-card"><div class="pmshri-card-icon">👨‍🎓</div><h3>' . esc_html($a['students']) . '</h3><p>Students</p></div>
      <div class="pmshri-card"><div class="pmshri-card-icon">👩‍🏫</div><h3>' . esc_html($a['teachers']) . '</h3><p>Teachers</p></div>
      <div class="pmshri-card"><div class="pmshri-card-icon">📚</div><h3>' . esc_html($a['classes']) . '</h3><p>Classes (I–XII)</p></div>
      <div class="pmshri-card"><div class="pmshri-card-icon">🏫</div><h3>' . esc_html($a['estd']) . '</h3><p>Established</p></div>
    </div>';
});

add_shortcode('pmshri_principal', function ($atts) {
    $a = shortcode_atts(['name' => 'Principal', 'message' => '', 'image' => ''], $atts);
    $img = $a['image']
        ? '<img src="' . esc_url($a['image']) . '" alt="Principal">'
        : '<div style="width:100px;height:120px;background:#1B3A6B;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;flex-shrink:0">👤</div>';
    return '<div class="pmshri-principal-card">' . $img . '<div><blockquote>"' . esc_html($a['message']) . '"</blockquote><cite>— ' . esc_html($a['name']) . '<br><small>Principal</small></cite></div></div>';
});

add_shortcode('pmshri_notice', function ($atts) {
    $a = shortcode_atts(['text' => ''], $atts);
    if (!$a['text']) return '';
    return '<div class="pmshri-ticker"><span class="pmshri-ticker-label">NOTICE</span>' . esc_html($a['text']) . '</div>';
});

// ── PRINCIPAL DASHBOARD CUSTOMIZATION ───────────────────────
// Only runs inside wp-admin, only for subsite admins (not super admin)

add_action('admin_init', function () {
    // Super admin ko kuch restrict nahi
    if (is_super_admin()) return;
    // Only in admin context
    if (!is_admin()) return;
});

// Remove unnecessary menu items for non-super-admins
add_action('admin_menu', function () {
    if (is_super_admin()) return;

    // Posts section hata do (school website mein posts nahi chahiye)
    remove_menu_page('edit.php');
    // Comments hata do
    remove_menu_page('edit-comments.php');

}, 999);

// Clean up dashboard widgets
add_action('wp_dashboard_setup', function () {
    if (is_super_admin()) return;

    $widgets_to_remove = [
        'dashboard_quick_press',
        'dashboard_recent_drafts',
        'dashboard_primary',
        'dashboard_secondary',
        'dashboard_incoming_links',
        'dashboard_plugins',
        'dashboard_recent_comments',
        'dashboard_activity',
    ];
    foreach ($widgets_to_remove as $widget) {
        remove_meta_box($widget, 'dashboard', 'side');
        remove_meta_box($widget, 'dashboard', 'main');
        remove_meta_box($widget, 'dashboard', 'normal');
    }
});

// Custom welcome widget for principal
add_action('wp_dashboard_setup', function () {
    if (is_super_admin()) return;

    wp_add_dashboard_widget(
        'pmshri_welcome',
        '🏫 PM SHRI School — Quick Guide',
        function () {
            $blog = get_blog_details(get_current_blog_id());
            ?>
            <div style="padding:6px 0">
              <p style="font-size:15px;font-weight:700;color:#1B3A6B;margin-bottom:6px">
                Namaste! Welcome to <strong><?php echo esc_html($blog->blogname); ?></strong>
              </p>
              <p style="color:#555;font-size:13px;margin-bottom:16px">
                Yahan se aap apni school ki website ke pages aur photos update kar sakte hain.
              </p>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <a href="<?php echo admin_url('edit.php?post_type=page'); ?>"
                   style="background:#FF6B00;color:#fff;padding:9px 16px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:5px">
                  📄 Pages Edit Karen
                </a>
                <a href="<?php echo admin_url('upload.php'); ?>"
                   style="background:#1B3A6B;color:#fff;padding:9px 16px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:5px">
                  🖼 Photos Upload Karen
                </a>
                <a href="<?php echo get_home_url(get_current_blog_id()); ?>" target="_blank"
                   style="background:#28a745;color:#fff;padding:9px 16px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:5px">
                  🌐 Website Dekhen
                </a>
              </div>
              <hr style="margin:16px 0;border-color:#eee">
              <p style="font-size:12px;color:#888">
                ℹ️ Pages mein apna naam, photo aur school ki jaankari update kar sakte hain.<br>
                Koi problem ho to IT Team se sampark karen.
              </p>
            </div>
            <?php
        }
    );
});

// Admin bar simplify for non-super-admins
add_action('wp_before_admin_bar_render', function () {
    global $wp_admin_bar;
    if (is_super_admin()) return;
    $wp_admin_bar->remove_menu('new-content');
    $wp_admin_bar->remove_menu('comments');
});
