(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const ADMIN_EMAIL = "nato.nato@aol.com";
  const announce = (message) => {
    const toast = $("#toast");
    $("#toastMessage").textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(announce.timer);
    announce.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
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
  let currentSession = null;
  let forumInitialized = false;
  let forumLoadVersion = 0;
  let forumAuthPromptRequested = false;
  let adminMessages = [];
  let adminMessageRefreshTimer = null;
  const openAdminMessageIds = new Set();
  function isForumAdmin() {
    return currentSession?.user?.email?.toLowerCase() === ADMIN_EMAIL;
  }
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
    currentSession = session;
    const isSignedIn = Boolean(session);
    registrationForm.hidden = isSignedIn;
    authModeSwitch.hidden = isSignedIn;
    $("#authSession").hidden = !isSignedIn;
    $("#authUserEmail").textContent = session?.user?.email || "";
    $("#loginNavLink").hidden = isSignedIn;
    $("#navLogoutButton").hidden = !isSignedIn;
    $("#adminMessages").hidden = !isForumAdmin();
    if (isSignedIn) forumAuthPromptRequested = false;
    $("#forumAuthPrompt").hidden = isSignedIn || !forumAuthPromptRequested;
    if (forumInitialized) {
      loadForumQuestions();
      syncAdminMessageRefresh();
    }
  }
  const navLogoutButton = $("#navLogoutButton");
  navLogoutButton.addEventListener("click", async () => {
    navLogoutButton.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        registrationStatus.textContent = `Unable to sign out: ${error.message}`;
        announce("Unable to sign out. Please try again.");
        return;
      }
      registrationStatus.textContent = "You have signed out.";
      announce("You have signed out.");
      if (menuToggle.getAttribute("aria-expanded") === "true") menuToggle.click();
    } catch (error) {
      console.error("Supabase sign-out failed.", error);
      registrationStatus.textContent = "Unable to reach the authentication service. Please try again.";
      announce("Unable to reach the authentication service. Please try again.");
    } finally {
      navLogoutButton.disabled = false;
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

  const forumForm = $("#forumForm");
  const forumStatus = $("#forumStatus");
  const forumAuthPrompt = $("#forumAuthPrompt");
  const forumSubmit = $("#forumSubmit");
  function renderForumQuestions(questions) {
    const list = $("#forumList");
    list.replaceChildren();
    $("#forumListTitle").textContent = "Your questions";
    $("#forumCount").textContent = `${questions.length} ${questions.length === 1 ? "question" : "questions"}`;
    if (!questions.length) {
      const empty = document.createElement("div");
      empty.className = "forum-empty";
      empty.textContent = currentSession ? "No questions yet." : "Log in to view your questions and replies.";
      list.append(empty);
      return;
    }
    questions.forEach((question) => {
      const article = document.createElement("article");
      article.className = "forum-post";
      const head = document.createElement("div");
      head.className = "forum-post-head";
      const author = document.createElement("span");
      author.textContent = isForumAdmin()
        ? `${question.user_name} · ${question.user_email}`
        : question.user_name;
      const category = document.createElement("span");
      category.className = "tag";
      category.textContent = question.category;
      head.append(author, category);
      const topic = document.createElement("h4");
      topic.textContent = question.question;
      const date = document.createElement("div");
      date.className = "forum-post-head";
      date.textContent = new Date(question.created_at).toLocaleString();
      article.append(head, topic, date);
      if (question.admin_reply) {
        const reply = document.createElement("div");
        reply.className = "forum-reply";
        const replyHeading = document.createElement("strong");
        replyHeading.textContent = "Administrator reply";
        const replyBody = document.createElement("p");
        replyBody.textContent = question.admin_reply;
        reply.append(replyHeading, replyBody);
        article.append(reply);
      }
      list.append(article);
    });
  }
  function createAdminReplyForm(question) {
    const replyForm = document.createElement("form");
    replyForm.className = "admin-reply-form";
    const replyInput = document.createElement("textarea");
    replyInput.className = "field-textarea";
    replyInput.rows = 3;
    replyInput.maxLength = 1000;
    replyInput.required = true;
    replyInput.setAttribute("aria-label", `Reply to ${question.user_name}'s question`);
    replyInput.value = question.admin_reply || "";
    const replyButton = document.createElement("button");
    replyButton.className = "button-primary";
    replyButton.type = "submit";
    replyButton.textContent = question.admin_reply ? "Update reply" : "Send reply";
    replyForm.append(replyInput, replyButton);
    replyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const replyText = replyInput.value.trim();
      if (!replyText) {
        replyInput.focus();
        forumStatus.textContent = "Enter a reply before sending.";
        return;
      }
      replyButton.disabled = true;
      try {
        const { error } = await supabaseClient
          .from("gck_questions")
          .update({ admin_reply: replyText, replied_at: new Date().toISOString() })
          .eq("id", question.id)
          .select("id")
          .single();
        if (error) {
          forumStatus.textContent = `Unable to send the reply: ${error.message}`;
          return;
        }
        forumStatus.textContent = "Your reply has been sent.";
        announce("Your reply has been sent.");
        await loadForumQuestions();
      } catch (error) {
        console.error("Question reply failed.", error);
        forumStatus.textContent = "Unable to reach the question service. Please try again.";
      } finally {
        replyButton.disabled = false;
      }
    });
    return replyForm;
  }
  function renderAdminMessages(messages) {
    adminMessages = messages;
    const unreadCount = messages.filter((message) => !message.admin_read_at).length;
    const unreadBadge = $("#adminUnreadCount");
    unreadBadge.textContent = String(unreadCount);
    unreadBadge.setAttribute("aria-label", `${unreadCount} unread messages`);
    const list = $("#adminMessagesList");
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement("div");
      empty.className = "forum-empty";
      empty.textContent = "No messages yet.";
      list.append(empty);
      return;
    }
    messages.forEach((question) => {
      const article = document.createElement("article");
      article.className = "forum-post admin-message";
      const head = document.createElement("div");
      head.className = "forum-post-head";
      const sender = document.createElement("span");
      sender.textContent = `${question.user_name} · ${question.user_email}`;
      const category = document.createElement("span");
      category.className = "tag";
      category.textContent = question.category;
      head.append(sender, category);
      const date = document.createElement("div");
      date.className = "forum-post-head";
      date.textContent = new Date(question.created_at).toLocaleString();
      const isOpen = openAdminMessageIds.has(question.id);
      const actions = document.createElement("div");
      actions.className = "admin-message-actions";
      if (!question.admin_read_at) {
        const unread = document.createElement("span");
        unread.className = "tag message-unread";
        unread.textContent = "Unread";
        actions.append(unread);
      }
      const openButton = document.createElement("button");
      openButton.className = "filter-button";
      openButton.type = "button";
      openButton.textContent = isOpen ? "Close message" : "Open message";
      openButton.setAttribute("aria-expanded", String(isOpen));
      openButton.addEventListener("click", async () => {
        if (openAdminMessageIds.has(question.id)) {
          openAdminMessageIds.delete(question.id);
          renderAdminMessages(adminMessages);
          return;
        }
        openAdminMessageIds.add(question.id);
        if (!question.admin_read_at) {
          openButton.disabled = true;
          try {
            const readAt = new Date().toISOString();
            const { error } = await supabaseClient
              .from("gck_questions")
              .update({ admin_read_at: readAt })
              .eq("id", question.id)
              .is("admin_read_at", null);
            if (error) {
              forumStatus.textContent = `Unable to mark the message as read: ${error.message}`;
              openAdminMessageIds.delete(question.id);
            } else {
              adminMessages = adminMessages.map((message) => (
                message.id === question.id ? { ...message, admin_read_at: readAt } : message
              ));
            }
          } catch (error) {
            console.error("Marking message read failed.", error);
            forumStatus.textContent = "Unable to reach the message service. Please try again.";
            openAdminMessageIds.delete(question.id);
          }
        }
        renderAdminMessages(adminMessages);
      });
      actions.append(openButton);
      article.append(head, date, actions);
      if (isOpen) {
        const message = document.createElement("p");
        message.textContent = question.question;
        article.append(message);
        if (question.admin_reply) {
          const reply = document.createElement("div");
          reply.className = "forum-reply";
          const replyHeading = document.createElement("strong");
          replyHeading.textContent = "Administrator reply";
          const replyBody = document.createElement("p");
          replyBody.textContent = question.admin_reply;
          reply.append(replyHeading, replyBody);
          article.append(reply);
        }
        article.append(createAdminReplyForm(question));
      }
      list.append(article);
    });
  }
  function showAdminMessageLoadError(message) {
    if (!isForumAdmin()) {
      renderAdminMessages([]);
      return;
    }
    if (!adminMessages.length) {
      const unreadBadge = $("#adminUnreadCount");
      unreadBadge.textContent = "!";
      unreadBadge.setAttribute("aria-label", "Unread message count unavailable");
    }
    const list = $("#adminMessagesList");
    list.replaceChildren();
    const error = document.createElement("div");
    error.className = "forum-empty";
    error.textContent = message;
    list.append(error);
  }
  async function loadForumQuestions() {
    const loadVersion = ++forumLoadVersion;
    if (!currentSession) {
      forumStatus.textContent = "";
      renderAdminMessages([]);
      renderForumQuestions([]);
      return;
    }
    if (!supabaseClient) {
      forumStatus.textContent = "The question service is unavailable. Please reload the page.";
      showAdminMessageLoadError("Unable to load messages. Please reload the page.");
      renderForumQuestions([]);
      return;
    }
    $("#forumCount").textContent = "Loading...";
    try {
      const { data, error } = await supabaseClient
        .from("gck_questions")
        .select("id, user_id, user_email, user_name, category, question, admin_reply, admin_read_at, created_at, replied_at")
        .order("created_at", { ascending: false });
      if (loadVersion !== forumLoadVersion) return;
      if (error) {
        forumStatus.textContent = `Unable to load questions: ${error.message}`;
        showAdminMessageLoadError("Unable to load messages. Please try again.");
        renderForumQuestions([]);
        return;
      }
      const questions = data || [];
      if (isForumAdmin()) {
        renderAdminMessages(questions.filter((question) => question.user_id !== currentSession.user.id));
        renderForumQuestions(questions.filter((question) => question.user_id === currentSession.user.id));
      } else {
        renderAdminMessages([]);
        renderForumQuestions(questions);
      }
    } catch (error) {
      if (loadVersion !== forumLoadVersion) return;
      console.error("Loading questions failed.", error);
      forumStatus.textContent = "Unable to reach the question service. Please try again.";
      showAdminMessageLoadError("Unable to load messages. Please try again.");
      renderForumQuestions([]);
    }
  }
  function syncAdminMessageRefresh() {
    if (forumInitialized && isForumAdmin()) {
      if (!adminMessageRefreshTimer) {
        adminMessageRefreshTimer = window.setInterval(loadForumQuestions, 30000);
      }
      return;
    }
    if (adminMessageRefreshTimer) {
      window.clearInterval(adminMessageRefreshTimer);
      adminMessageRefreshTimer = null;
    }
  }
  $("#adminMessagesTab").addEventListener("click", () => {
    const button = $("#adminMessagesTab");
    const panel = $("#adminMessagesPanel");
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    panel.hidden = isExpanded;
    if (!isExpanded) loadForumQuestions();
  });
  $("#forumLoginPrompt").addEventListener("click", () => setAuthMode("signin"));
  $("#forumRegisterPrompt").addEventListener("click", () => setAuthMode("signup"));
  forumForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentSession) {
      forumAuthPromptRequested = true;
      forumAuthPrompt.hidden = false;
      forumStatus.textContent = "";
      announce("Log in or create an account to send your question.");
      return;
    }
    const name = $("#forumName");
    const topic = $("#forumTopic");
    const category = $("#forumCategory");
    const nameValid = validateField(name) && name.value.trim().length >= 2;
    const topicValid = validateField(topic) && topic.value.trim().length >= 5;
    if (!nameValid && name.value.trim().length > 0 && name.value.trim().length < 2) {
      name.setAttribute("aria-invalid", "true");
      $("#forumNameError").textContent = "Enter at least 2 non-space characters.";
    }
    if (!topicValid && topic.value.trim().length > 0 && topic.value.trim().length < 5) {
      topic.setAttribute("aria-invalid", "true");
      $("#forumTopicError").textContent = "Enter at least 5 non-space characters.";
    }
    if (!category.value) category.setAttribute("aria-invalid", "true");
    else category.removeAttribute("aria-invalid");
    if (!nameValid || !topicValid || !category.value) {
      $("#forumStatus").textContent = "Please complete all required fields.";
      (nameValid ? topicValid ? category : name : name).focus();
      return;
    }
    forumSubmit.disabled = true;
    forumSubmit.textContent = "Sending question...";
    forumStatus.textContent = "";
    try {
      const question = {
        user_id: currentSession.user.id,
        user_email: currentSession.user.email,
        user_name: name.value.trim(),
        category: category.value,
        question: topic.value.trim()
      };
      const { error } = await supabaseClient.from("gck_questions").insert(question);
      if (error) {
        forumStatus.textContent = `Unable to send your question: ${error.message}`;
        return;
      }
      document.dispatchEvent(new CustomEvent("gck:forum-posted", { detail: question }));
      forumForm.reset();
      name.removeAttribute("aria-invalid");
      topic.removeAttribute("aria-invalid");
      category.removeAttribute("aria-invalid");
      $("#forumNameError").textContent = "";
      $("#forumTopicError").textContent = "";
      forumStatus.textContent = "Your question has been sent privately to the administrator.";
      await loadForumQuestions();
    } catch (error) {
      console.error("Sending question failed.", error);
      forumStatus.textContent = "Unable to reach the question service. Please try again.";
    } finally {
      forumSubmit.disabled = false;
      forumSubmit.innerHTML = 'Send question <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
    }
  });
  [$("#forumName"), $("#forumTopic")].forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });
  forumInitialized = true;
  loadForumQuestions();
  syncAdminMessageRefresh();
  $("#currentYear").textContent = new Date().getFullYear();
})();
