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
  const supabaseClient = window.supabase && typeof window.supabase.createClient === "function"
    ? window.supabase.createClient(
      "https://gaxryrslkfhaopqwayrv.supabase.co",
      "sb_publishable_cKWyCmyOlXSHBmsMgl8-fA_v1zp-a0Y"
    )
    : null;

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
  const authModeSwitch = $("#authModeSwitch");
  const registrationStatus = $("#registrationStatus");
  const registrationSubmit = $("#registrationSubmit");
  const resendConfirmationButton = $("#resendConfirmation");
  const authFields = ["memberName", "memberEmail", "memberPassword", "memberPhone", "memberLocation"];
  let authMode = "signup";
  const errorText = (field) => {
    if (field.validity.valueMissing) return "This field is required.";
    if (field.validity.typeMismatch) return "Enter a valid email address.";
    if (field.validity.tooShort && field.id === "memberPassword") return "Password must be at least 8 characters.";
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
  function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    ["memberNameField", "memberPhoneField", "memberLocationField", "memberYouthField"].forEach((id) => {
      $(`#${id}`).hidden = !isSignup;
    });
    $("#memberConsent").hidden = !isSignup;
    $("#memberPassword").autocomplete = isSignup ? "new-password" : "current-password";
    $$("[data-auth-mode]", authModeSwitch).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.authMode === mode));
    });
    registrationSubmit.innerHTML = isSignup
      ? 'Create account <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>'
      : 'Log in <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    registrationStatus.textContent = "";
    resendConfirmationButton.hidden = true;
    authFields.forEach((id) => {
      const field = $(`#${id}`);
      field.removeAttribute("aria-invalid");
      $(`#${id}Error`).textContent = "";
    });
  }
  authModeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-auth-mode]");
    if (button) setAuthMode(button.dataset.authMode);
  });
  $("#loginNavLink").addEventListener("click", () => setAuthMode("signin"));
  authFields.forEach((id) => {
    const field = $(`#${id}`);
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });
  function showAuthSession(session) {
    const isSignedIn = Boolean(session);
    registrationForm.hidden = isSignedIn;
    authModeSwitch.hidden = isSignedIn;
    $("#authSession").hidden = !isSignedIn;
    $("#authUserEmail").textContent = session?.user?.email || "";
  }
  $("#signOutButton").addEventListener("click", async () => {
    const signOutButton = $("#signOutButton");
    signOutButton.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        registrationStatus.textContent = `Unable to sign out: ${error.message}`;
        return;
      }
      registrationStatus.textContent = "You have signed out.";
    } catch (error) {
      console.error("Supabase sign-out failed.", error);
      registrationStatus.textContent = "Unable to reach the authentication service. Please try again.";
    } finally {
      signOutButton.disabled = false;
    }
  });
  resendConfirmationButton.addEventListener("click", async () => {
    const emailField = $("#memberEmail");
    if (!validateField(emailField)) {
      emailField.focus();
      return;
    }
    resendConfirmationButton.disabled = true;
    registrationStatus.textContent = "Sending a confirmation email...";
    try {
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email: emailField.value.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}#register`
        }
      });
      if (error) {
        registrationStatus.textContent = `Unable to resend the confirmation email: ${error.message}`;
        return;
      }
      registrationStatus.textContent = "If this address needs confirmation, a new email has been sent.";
    } catch (error) {
      console.error("Supabase confirmation resend failed.", error);
      registrationStatus.textContent = "Unable to reach the authentication service. Please try again.";
    } finally {
      resendConfirmationButton.disabled = false;
    }
  });
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((_event, session) => showAuthSession(session));
    supabaseClient.auth.getSession().then(({ data, error }) => {
      if (error) {
        registrationStatus.textContent = `Unable to check your sign-in status: ${error.message}`;
        return;
      }
      showAuthSession(data.session);
    }).catch((error) => {
      console.error("Supabase session check failed.", error);
      registrationStatus.textContent = "Unable to reach the authentication service. Please reload the page.";
    });
  } else {
    registrationStatus.textContent = "Authentication could not load. Check your connection and reload the page.";
  }
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fieldIds = authMode === "signup"
      ? ["memberName", "memberEmail", "memberPassword", "memberPhone", "memberLocation"]
      : ["memberEmail", "memberPassword"];
    const isValid = fieldIds.map((id) => validateField($(`#${id}`))).every(Boolean);
    if (!isValid) {
      $(`[aria-invalid="true"]`, registrationForm)?.focus();
      return;
    }
    if (!supabaseClient) {
      registrationStatus.textContent = "Authentication is unavailable. Check your connection and reload the page.";
      return;
    }
    registrationSubmit.disabled = true;
    registrationSubmit.textContent = authMode === "signup" ? "Creating account..." : "Logging in...";
    try {
      if (authMode === "signup") {
        const member = {
          full_name: $("#memberName").value.trim(),
          phone: $("#memberPhone").value.trim(),
          county_constituency: $("#memberLocation").value.trim(),
          youth_representative: $("#memberYouth").checked
        };
        const { data, error } = await supabaseClient.auth.signUp({
          email: $("#memberEmail").value.trim(),
          password: $("#memberPassword").value,
          options: {
            data: member,
            emailRedirectTo: `${window.location.origin}${window.location.pathname}#register`
          }
        });
        if (error) {
          registrationStatus.textContent = `Unable to create your account: ${error.message}`;
          return;
        }
        document.dispatchEvent(new CustomEvent("gck:member-registered", { detail: member }));
        const email = $("#memberEmail").value.trim();
        registrationForm.reset();
        $("#memberEmail").value = email;
        const message = data.session
          ? "Your account has been created and you are signed in."
          : "Account created. Check your email for a confirmation link before signing in.";
        registrationStatus.textContent = message;
        announce(message);
        if (data.session) showAuthSession(data.session);
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: $("#memberEmail").value.trim(),
          password: $("#memberPassword").value
        });
        if (error) {
          const errorMessage = error.message.toLowerCase();
          const emailNeedsConfirmation = error.code === "email_not_confirmed"
            || errorMessage.includes("email not confirmed");
          if (emailNeedsConfirmation) {
            registrationStatus.textContent = "Confirm your email using the link we sent, or request a new confirmation email below.";
            resendConfirmationButton.hidden = false;
          } else if (error.code === "invalid_credentials" || errorMessage.includes("invalid login credentials")) {
            registrationStatus.textContent = "Email or password is incorrect. Check both and confirm your email before signing in.";
          } else {
            registrationStatus.textContent = `Unable to sign in: ${error.message}`;
          }
          return;
        }
        registrationStatus.textContent = "You are signed in.";
        showAuthSession(data.session);
        announce("You are signed in.");
      }
    } catch (error) {
      console.error("Supabase authentication request failed.", error);
      registrationStatus.textContent = "Unable to reach the authentication service. Please try again.";
    } finally {
      registrationSubmit.disabled = false;
      registrationSubmit.innerHTML = authMode === "signup"
        ? 'Create account <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>'
        : 'Log in <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    }
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
