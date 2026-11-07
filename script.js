(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const announce = (message) => {
    const toast = $("#toast");
    $("#toastMessage").textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(announce.timer);
    announce.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  };
  const readStorage = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };
  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const menuToggle = $("#menuToggle");
  const navPanel = $("#navPanel");
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navPanel.classList.toggle("is-open", !isOpen);
    menuToggle.innerHTML = `<i class="fa-solid ${isOpen ? "fa-bars" : "fa-xmark"}" aria-hidden="true"></i>`;
  });
  $$("#navPanel a").forEach((link) => link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    navPanel.classList.remove("is-open");
    menuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") menuToggle.click();
  });

  const carouselTrack = $("#carouselTrack");
  const slides = $$(".carousel-slide", carouselTrack);
  const dots = $("#carouselDots");
  let slideIndex = 0;
  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    dots.append(dot);
  });
  function showSlide(index) {
    slideIndex = (index + slides.length) % slides.length;
    carouselTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
    $$(".carousel-dot", dots).forEach((dot, dotIndex) => dot.setAttribute("aria-current", String(dotIndex === slideIndex)));
    slides.forEach((slide, slideNumber) => slide.setAttribute("aria-hidden", String(slideNumber !== slideIndex)));
  }
  $("#slidePrev").addEventListener("click", () => showSlide(slideIndex - 1));
  $("#slideNext").addEventListener("click", () => showSlide(slideIndex + 1));
  showSlide(0);
  let carouselTimer = window.setInterval(() => showSlide(slideIndex + 1), 6000);
  $("#carouselFrame").addEventListener("mouseenter", () => window.clearInterval(carouselTimer));
  $("#carouselFrame").addEventListener("mouseleave", () => {
    window.clearInterval(carouselTimer);
    carouselTimer = window.setInterval(() => showSlide(slideIndex + 1), 6000);
  });

  $$(".pillar-card .text-control").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest(".pillar-card");
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    card.classList.toggle("is-open", !isOpen);
    button.innerHTML = isOpen ? 'Explore pillar <i class="fa-solid fa-plus" aria-hidden="true"></i>' : 'Close details <i class="fa-solid fa-minus" aria-hidden="true"></i>';
  }));

  const mediaFilters = $("#mediaFilters");
  mediaFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-media-filter]");
    if (!button) return;
    const selected = button.dataset.mediaFilter;
    $$('[data-media-filter]', mediaFilters).forEach((filter) => filter.setAttribute("aria-pressed", String(filter === button)));
    $$(".media-item").forEach((item) => {
      item.hidden = selected !== "all" && !item.dataset.mediaTags.split("|").includes(selected);
    });
  });

  const updates = [
    { title: "Sample: Local voices in environmental planning", category: "Environment", date: "Date to be confirmed", text: "A draft update about community participation in local environmental priorities. Replace with an approved report before publication." },
    { title: "Sample: Youth dialogue and civic participation", category: "Youth & democracy", date: "Date to be confirmed", text: "A draft update about creating space for young people to take part in public discussion. Replace with verified event details." },
    { title: "Sample: Building peaceful community dialogue", category: "Peace & governance", date: "Date to be confirmed", text: "A draft update about inclusive, nonviolent ways to discuss shared priorities. Replace with an approved party statement." }
  ];
  const newsGrid = $("#newsGrid");
  function renderNews(query = "") {
    newsGrid.replaceChildren();
    const normalized = query.trim().toLocaleLowerCase();
    const matches = updates.filter((item) => `${item.title} ${item.category} ${item.text}`.toLocaleLowerCase().includes(normalized));
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "forum-empty col-span-full";
      empty.textContent = "No updates match that search.";
      newsGrid.append(empty);
      return;
    }
    matches.forEach((item) => {
      const article = document.createElement("article");
      article.className = "news-card";
      const meta = document.createElement("div");
      meta.className = "news-meta";
      const category = document.createElement("span");
      category.className = "tag";
      category.textContent = item.category;
      const date = document.createElement("time");
      date.textContent = item.date;
      meta.append(category, date);
      const title = document.createElement("h3");
      title.textContent = item.title;
      const text = document.createElement("p");
      text.textContent = item.text;
      article.append(meta, title, text);
      newsGrid.append(article);
    });
  }
  $("#newsSearch").addEventListener("input", (event) => renderNews(event.target.value));
  renderNews();

  const registrationForm = $("#registrationForm");
  const registrationFields = ["memberName", "memberEmail", "memberPhone", "memberLocation"];
  const errorText = (field) => {
    if (field.validity.valueMissing) return "This field is required.";
    if (field.validity.typeMismatch) return "Enter a valid email address.";
    if (field.validity.tooShort) return `Enter at least ${field.minLength} characters.`;
    if (field.id === "memberPhone") return "Enter a valid mobile number.";
    return "Please check this field.";
  };
  function validateField(field) {
    const error = $(`#${field.id}Error`);
    const normalizedPhone = field.id === "memberPhone" ? field.value.replace(/[\s()-]/g, "") : "";
    const phoneIsValid = field.id !== "memberPhone" || /^\+?[0-9]{8,15}$/.test(normalizedPhone);
    const valid = field.checkValidity() && phoneIsValid;
    field.setAttribute("aria-invalid", String(!valid));
    if (error) error.textContent = valid ? "" : errorText(field);
    return valid;
  }
  registrationFields.forEach((id) => {
    const field = $(`#${id}`);
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });
  $("#verifyPhone").addEventListener("click", () => {
    const phone = $("#memberPhone");
    if (!validateField(phone)) {
      phone.focus();
      return;
    }
    const detail = { phone: phone.value.trim(), demo: true };
    // Replace this event handler with an approved SMS gateway request in production.
    document.dispatchEvent(new CustomEvent("gck:sms-verification-requested", { detail }));
    $("#smsStatus").textContent = "Demo only: no SMS was sent.";
    announce("SMS verification is a placeholder. No message was sent.");
  });
  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const isValid = registrationFields.map((id) => validateField($(`#${id}`))).every(Boolean);
    if (!isValid) {
      $(`[aria-invalid="true"]`, registrationForm)?.focus();
      $("#registrationStatus").textContent = "Please correct the highlighted fields.";
      return;
    }
    const member = {
      name: $("#memberName").value.trim(),
      email: $("#memberEmail").value.trim(),
      phone: $("#memberPhone").value.trim(),
      location: $("#memberLocation").value.trim(),
      youthRepresentative: $("#memberYouth").checked,
      submittedAt: new Date().toISOString()
    };
    const members = readStorage("gck:members", []);
    members.push(member);
    const stored = writeStorage("gck:members", members);
    // Replace local storage with a secure, consent-aware membership API before launch.
    document.dispatchEvent(new CustomEvent("gck:member-registered", { detail: member }));
    registrationForm.reset();
    registrationFields.forEach((id) => $(`#${id}`).removeAttribute("aria-invalid"));
    registrationFields.forEach((id) => { const error = $(`#${id}Error`); if (error) error.textContent = ""; });
    $("#smsStatus").textContent = "Demo placeholder only";
    const message = stored ? "Thank you. Your demo registration is saved in this browser." : "Thank you. Registration was received for this session, but browser storage is unavailable.";
    $("#registrationStatus").textContent = message;
    announce(message);
  });

  const forumKey = "gck:forum-posts";
  let posts = readStorage(forumKey, []);
  if (!Array.isArray(posts)) posts = [];
  function renderForum() {
    const list = $("#forumList");
    list.replaceChildren();
    $("#forumCount").textContent = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;
    if (!posts.length) {
      const empty = document.createElement("div");
      empty.className = "forum-empty";
      empty.textContent = "No questions yet. Start the conversation.";
      list.append(empty);
      return;
    }
    [...posts].reverse().forEach((post) => {
      const article = document.createElement("article");
      article.className = "forum-post";
      const head = document.createElement("div");
      head.className = "forum-post-head";
      const author = document.createElement("span");
      author.textContent = post.name;
      const category = document.createElement("span");
      category.className = "tag";
      category.textContent = post.category;
      head.append(author, category);
      const topic = document.createElement("h4");
      topic.textContent = post.topic;
      const date = document.createElement("div");
      date.className = "forum-post-head";
      date.textContent = new Date(post.createdAt).toLocaleDateString();
      const upvote = document.createElement("button");
      upvote.type = "button";
      upvote.className = "upvote-button";
      upvote.setAttribute("aria-label", `Upvote question by ${post.name}`);
      upvote.innerHTML = `<i class="fa-solid fa-arrow-up" aria-hidden="true"></i> <span>${Number(post.votes) || 0}</span>`;
      upvote.addEventListener("click", () => {
        post.votes = (Number(post.votes) || 0) + 1;
        writeStorage(forumKey, posts);
        document.dispatchEvent(new CustomEvent("gck:forum-upvoted", { detail: { id: post.id, votes: post.votes } }));
        renderForum();
      });
      article.append(head, topic, date, upvote);
      list.append(article);
    });
  }
  const forumForm = $("#forumForm");
  forumForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#forumName");
    const topic = $("#forumTopic");
    const category = $("#forumCategory");
    const nameValid = validateField(name);
    const topicValid = validateField(topic);
    if (!category.value) category.setAttribute("aria-invalid", "true");
    else category.removeAttribute("aria-invalid");
    if (!nameValid || !topicValid || !category.value) {
      $("#forumStatus").textContent = "Please complete all required fields.";
      (nameValid ? topicValid ? category : name : name).focus();
      return;
    }
    const post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.value.trim(),
      topic: topic.value.trim(),
      category: category.value,
      createdAt: new Date().toISOString(),
      votes: 0
    };
    posts.push(post);
    const stored = writeStorage(forumKey, posts);
    // Replace this local-only flow with a moderated forum API before production.
    document.dispatchEvent(new CustomEvent("gck:forum-posted", { detail: post }));
    forumForm.reset();
    name.removeAttribute("aria-invalid");
    topic.removeAttribute("aria-invalid");
    category.removeAttribute("aria-invalid");
    $("#forumNameError").textContent = "";
    $("#forumTopicError").textContent = "";
    $("#forumStatus").textContent = stored ? "Your question has been added." : "Your question has been added for this session only.";
    renderForum();
  });
  [$("#forumName"), $("#forumTopic")].forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });
  renderForum();
  $("#currentYear").textContent = new Date().getFullYear();
})();
