<?php
/**
 * Inner page template — all non-home pages
 */
get_header(); ?>

<div class="pmshri-page-wrap">
  <?php while (have_posts()) : the_post(); ?>
    <article <?php post_class(); ?>>
      <header class="entry-header">
        <h1 class="entry-title"><?php the_title(); ?></h1>
      </header>
      <div class="entry-content">
        <?php the_content(); ?>
      </div>
    </article>
  <?php endwhile; ?>
</div>

<?php get_footer();
