</div><!-- #page-wrap -->

<!-- ══ FOOTER ══ -->
<footer class="pmshri-footer">
  <div class="pmshri-footer-inner">

    <div class="pmshri-footer-grid">

      <!-- School Info -->
      <div class="pmshri-footer-col">
        <h4>🏫 <?php bloginfo('name'); ?></h4>
        <p><?php bloginfo('description'); ?></p>
        <p style="margin-top:10px;opacity:0.7;font-size:0.8rem">
          NEP 2020 के अंतर्गत एक आदर्श विद्यालय<br>
          Ek Aadarsh Vidyalaya under NEP 2020
        </p>
      </div>

      <!-- Quick Links -->
      <div class="pmshri-footer-col">
        <h4>⚡ Quick Links</h4>
        <ul class="pmshri-footer-links">
          <?php
          $pages = get_pages(['sort_column' => 'menu_order', 'number' => 6]);
          foreach ($pages as $p) {
            echo '<li><a href="' . get_permalink($p->ID) . '">→ ' . esc_html($p->post_title) . '</a></li>';
          }
          ?>
        </ul>
      </div>

      <!-- Important Links -->
      <div class="pmshri-footer-col">
        <h4>🔗 Mahatvapurna Links</h4>
        <ul class="pmshri-footer-links">
          <li><a href="https://pmshri.education.gov.in" target="_blank">→ PM SHRI Portal</a></li>
          <li><a href="https://cbse.gov.in" target="_blank">→ CBSE Official</a></li>
          <li><a href="https://upmsp.edu.in" target="_blank">→ UP Board</a></li>
          <li><a href="https://ncert.nic.in" target="_blank">→ NCERT</a></li>
          <li><a href="https://education.gov.in" target="_blank">→ Shiksha Mantralaya</a></li>
        </ul>
      </div>

    </div>

    <!-- Bottom bar -->
    <div class="pmshri-footer-bottom">
      <span>© <?php echo date('Y'); ?> <?php bloginfo('name'); ?> | PM SHRI Schools Network, Uttar Pradesh</span>
      <span>Powered by <strong>UP Shiksha Vibhag IT Team</strong></span>
    </div>

  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
