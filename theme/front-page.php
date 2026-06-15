<?php
/**
 * Home page template — hides "Home" title, shows full design
 */
get_header();

// Get school meta
$bid        = get_current_blog_id();
$principal  = get_blog_option($bid, 'pmshri_principal_name', 'Principal');
$district   = get_blog_option($bid, 'pmshri_district', 'Uttar Pradesh');
$students   = get_blog_option($bid, 'pmshri_students', '800+');
$teachers   = get_blog_option($bid, 'pmshri_teachers', '35');
$estd       = get_blog_option($bid, 'pmshri_estd', '1970');
$school_name = get_bloginfo('name');
?>

<!-- ══ ANNOUNCEMENT TICKER ══ -->
<div class="pmshri-ticker-bar">
  <span class="pmshri-ticker-lbl">📢 NOTICE</span>
  <span class="pmshri-ticker-text">
    PM SHRI School Website launch ho gayi hai — aur updates jald aayenge!
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Session 2025-26 ke liye Pravesh Prkriya shuru — Sampark Karen.
    &nbsp;&nbsp;|&nbsp;&nbsp;
    Varshik Sports Diwas — 15 May 2025 ko hoga. Sabhi chhatro ko amantraan.
  </span>
</div>

<!-- ══ HERO BANNER ══ -->
<section class="pmshri-hero-v2">
  <div class="pmshri-hero-overlay"></div>
  <div class="pmshri-hero-content">
    <div class="pmshri-hero-badge">🇮🇳 PM SHRI Designated School</div>
    <h1><?php echo esc_html($school_name); ?></h1>
    <p class="pmshri-hero-sub">Pradhan Mantri Schools for Rising India | राष्ट्रीय शिक्षा नीति 2020</p>
    <div class="pmshri-hero-btns">
      <a href="<?php echo get_permalink(get_page_by_path('about')); ?>" class="pmshri-btn-primary">हमारे बारे में</a>
      <a href="<?php echo get_permalink(get_page_by_path('contact')); ?>" class="pmshri-btn-outline">संपर्क करें</a>
    </div>
  </div>
</section>

<!-- ══ STATS BAR ══ -->
<section class="pmshri-stats-bar">
  <div class="pmshri-stat-item">
    <div class="pmshri-stat-icon">👨‍🎓</div>
    <div class="pmshri-stat-num"><?php echo esc_html($students); ?></div>
    <div class="pmshri-stat-label">छात्र / Students</div>
  </div>
  <div class="pmshri-stat-item">
    <div class="pmshri-stat-icon">👩‍🏫</div>
    <div class="pmshri-stat-num"><?php echo esc_html($teachers); ?></div>
    <div class="pmshri-stat-label">शिक्षक / Teachers</div>
  </div>
  <div class="pmshri-stat-item">
    <div class="pmshri-stat-icon">📚</div>
    <div class="pmshri-stat-num">I – XII</div>
    <div class="pmshri-stat-label">कक्षाएं / Classes</div>
  </div>
  <div class="pmshri-stat-item">
    <div class="pmshri-stat-icon">🏛️</div>
    <div class="pmshri-stat-num"><?php echo esc_html($estd); ?></div>
    <div class="pmshri-stat-label">स्थापना / Est.</div>
  </div>
  <div class="pmshri-stat-item">
    <div class="pmshri-stat-icon">🏆</div>
    <div class="pmshri-stat-num">98%</div>
    <div class="pmshri-stat-label">Board Result</div>
  </div>
</section>

<!-- ══ PRINCIPAL MESSAGE ══ -->
<section class="pmshri-section pmshri-bg-light">
  <div class="pmshri-container">
    <div class="pmshri-section-head">
      <span class="pmshri-section-tag">प्रधानाचार्य संदेश</span>
      <h2>Principal ka Sandesh</h2>
    </div>
    <div class="pmshri-principal-v2">
      <div class="pmshri-principal-img-wrap">
        <img src="https://placehold.co/200x240/1B3A6B/ffffff?text=<?php echo urlencode($principal); ?>&font=montserrat" alt="<?php echo esc_attr($principal); ?>" class="pmshri-principal-img">
        <div class="pmshri-principal-name-tag">
          <strong><?php echo esc_html($principal); ?></strong>
          <span>Principal</span>
        </div>
      </div>
      <div class="pmshri-principal-msg">
        <div class="pmshri-quote-mark">"</div>
        <p>Hamare PM SHRI Vidyalaya mein aapka hardik swagat hai. Hamara ek hi lakshya hai — har bachche ko uchch shiksha, samuchit marg darshan, aur ek ujjwal bhavishya pradan karna.</p>
        <p>Hum NEP 2020 ki bhaavana ke anusaar shiksha ko anand aur anveshan se jod rahe hain. Hamare shikshak, aadhunik suvidhayen, aur ek poshan yukta vatavaran — sab milkar ek aadarsh vidyalaya ki neenv rakhte hain.</p>
        <p>Aapka sehyog aur vishwas hamari sabse badi shakti hai.</p>
        <a href="<?php echo get_permalink(get_page_by_path('principals-message')); ?>" class="pmshri-link-arrow">Poora Sandesh Padhen →</a>
      </div>
    </div>
  </div>
</section>

<!-- ══ FACILITIES ══ -->
<section class="pmshri-section">
  <div class="pmshri-container">
    <div class="pmshri-section-head">
      <span class="pmshri-section-tag">हमारी सुविधाएं</span>
      <h2>Vishesh Suvidhayen</h2>
    </div>
    <div class="pmshri-facility-grid">
      <div class="pmshri-facility-card">
        <img src="https://placehold.co/400x220/1B3A6B/FF6B00?text=Smart+Classroom&font=montserrat" alt="Smart Classroom">
        <div class="pmshri-facility-body">
          <h3>💻 Smart Classroom</h3>
          <p>Sabhi kakshao mein projector, digital board aur high-speed internet ki suvidha.</p>
        </div>
      </div>
      <div class="pmshri-facility-card">
        <img src="https://placehold.co/400x220/1B3A6B/FF6B00?text=Science+Lab&font=montserrat" alt="Science Lab">
        <div class="pmshri-facility-body">
          <h3>🔬 Vigyan Prayogshala</h3>
          <p>Physics, Chemistry aur Biology ke liye alag-alag fully-equipped labs.</p>
        </div>
      </div>
      <div class="pmshri-facility-card">
        <img src="https://placehold.co/400x220/1B3A6B/FF6B00?text=Library&font=montserrat" alt="Library">
        <div class="pmshri-facility-body">
          <h3>📚 Pustakalaya</h3>
          <p>5000 se adhik pustaken, digital resources aur quiet study area.</p>
        </div>
      </div>
      <div class="pmshri-facility-card">
        <img src="https://placehold.co/400x220/1B3A6B/FF6B00?text=Sports+Ground&font=montserrat" alt="Sports Ground">
        <div class="pmshri-facility-body">
          <h3>⚽ Khel Maidan</h3>
          <p>Cricket, Football, Volleyball aur indoor sports ki vyavastha.</p>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-top:30px">
      <a href="<?php echo get_permalink(get_page_by_path('facilities')); ?>" class="pmshri-btn-primary">Saari Suvidhayen Dekhen →</a>
    </div>
  </div>
</section>

<!-- ══ GALLERY PREVIEW ══ -->
<section class="pmshri-section pmshri-bg-light">
  <div class="pmshri-container">
    <div class="pmshri-section-head">
      <span class="pmshri-section-tag">चित्र वीथिका</span>
      <h2>Hamare Vidyalaya ki Jhalakiyan</h2>
    </div>
    <div class="pmshri-gallery-grid">
      <img src="https://placehold.co/400x300/FF6B00/ffffff?text=Annual+Function&font=montserrat" alt="Annual Function">
      <img src="https://placehold.co/400x300/1B3A6B/ffffff?text=Sports+Day&font=montserrat" alt="Sports Day">
      <img src="https://placehold.co/400x300/2E5FA3/ffffff?text=Science+Fair&font=montserrat" alt="Science Fair">
      <img src="https://placehold.co/400x300/F7A800/1B3A6B?text=Republic+Day&font=montserrat" alt="Republic Day">
      <img src="https://placehold.co/400x300/28a745/ffffff?text=Prize+Distribution&font=montserrat" alt="Prize Distribution">
      <img src="https://placehold.co/400x300/6f42c1/ffffff?text=Cultural+Program&font=montserrat" alt="Cultural Program">
    </div>
    <div style="text-align:center;margin-top:30px">
      <a href="<?php echo get_permalink(get_page_by_path('gallery')); ?>" class="pmshri-btn-outline" style="border-color:var(--pmshri-navy);color:var(--pmshri-navy)">Poori Gallery Dekhen →</a>
    </div>
  </div>
</section>

<!-- ══ ACHIEVEMENTS ══ -->
<section class="pmshri-section">
  <div class="pmshri-container">
    <div class="pmshri-section-head">
      <span class="pmshri-section-tag">हमारी उपलब्धियां</span>
      <h2>Gauravshali Uplabdhiyan</h2>
    </div>
    <div class="pmshri-achieve-grid">
      <div class="pmshri-achieve-card">
        <div class="pmshri-achieve-icon">🏆</div>
        <h4>PM SHRI Designation</h4>
        <p>2023-24 mein PM SHRI School ke roop mein chuninda school</p>
      </div>
      <div class="pmshri-achieve-card">
        <div class="pmshri-achieve-icon">📊</div>
        <h4>98% Board Result</h4>
        <p>Lagaataar teen saalo se uchch parinaam aur prathm shreni</p>
      </div>
      <div class="pmshri-achieve-card">
        <div class="pmshri-achieve-icon">🌱</div>
        <h4>Swachh Vidyalaya</h4>
        <p>Swachh Bharat Abhiyan ke tahat purasrit vidyalaya</p>
      </div>
      <div class="pmshri-achieve-card">
        <div class="pmshri-achieve-icon">💡</div>
        <h4>Digital Champion</h4>
        <p>Poornatah digital shiksha pranali mein agrani vidyalaya</p>
      </div>
    </div>
  </div>
</section>

<?php get_footer(); ?>
