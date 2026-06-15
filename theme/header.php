<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- ══ GOV TOP STRIP ══ -->
<div class="pmshri-topstrip">
  <div class="pmshri-topstrip-inner">
    <span>🇮🇳 भारत सरकार | Government of India</span>
    <span>उत्तर प्रदेश शिक्षा विभाग | UP Shiksha Vibhag</span>
  </div>
</div>

<!-- ══ MAIN HEADER ══ -->
<header class="pmshri-header">
  <div class="pmshri-header-inner">

    <!-- Left: Emblem + School Name -->
    <div class="pmshri-brand">
      <div class="pmshri-emblem">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png" alt="Emblem of India" height="60">
      </div>
      <div class="pmshri-brand-text">
        <div class="pmshri-brand-hindi">प्रधानमंत्री स्कूल्स फॉर राइजिंग इंडिया</div>
        <div class="pmshri-brand-name"><?php bloginfo('name'); ?></div>
        <div class="pmshri-brand-desc"><?php bloginfo('description'); ?></div>
      </div>
    </div>

    <!-- Right: PM SHRI Logo badge -->
    <div class="pmshri-badge">
      <div class="pmshri-badge-inner">
        <div class="pmshri-badge-top">PM SHRI</div>
        <div class="pmshri-badge-sub">School</div>
        <div class="pmshri-badge-star">⭐⭐⭐</div>
      </div>
    </div>

  </div>
</header>

<!-- ══ NAVIGATION ══ -->
<nav class="pmshri-nav">
  <div class="pmshri-nav-inner">
    <button class="pmshri-hamburger" onclick="document.querySelector('.pmshri-menu').classList.toggle('open')" aria-label="Menu">☰</button>
    <?php
    wp_nav_menu([
      'theme_location' => 'primary',
      'container'      => false,
      'menu_class'     => 'pmshri-menu',
      'fallback_cb'    => function() {
        // Auto-generate menu from pages if no menu assigned
        echo '<ul class="pmshri-menu">';
        $pages = get_pages(['sort_column' => 'menu_order', 'post_status' => 'publish']);
        foreach ($pages as $p) {
          $active = (get_the_ID() == $p->ID) ? ' class="current"' : '';
          echo '<li' . $active . '><a href="' . get_permalink($p->ID) . '">' . esc_html($p->post_title) . '</a></li>';
        }
        echo '</ul>';
      },
    ]);
    ?>
  </div>
</nav>

<div id="page-wrap">
