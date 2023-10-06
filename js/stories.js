"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  //console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  /* Determine if stars should be on page if user is logged in */
  const showStar = Boolean(currentUser);

  const showDelete = Boolean(story);

  return $(`
      <li id="${story.storyId}">
        ${showStar ? getStarHTML(story, currentUser) : ""}
        ${isUserStory(story, currentUser) ? getDeleteBtnHTML() : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function isUserStory(story, user) {
  if (user) {
    return user.isUserOwnStory(story);
  } else {
    return false;
  }
}

/* Delete button HTML */
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

/* Determine if story is favorite and update star */
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function newStorySubmission(evt) {
  evt.preventDefault();
  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();
  const username = currentUser.username;

  const storyData = { title, author, url, username };

  const newStory = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(newStory);
  $allStoriesList.prepend($story);

  $submitStoryForm.fadeOut("slow");
  $submitStoryForm.trigger("reset");
}
$submitStoryForm.on("submit", newStorySubmission);

/* Toggle favorites */
async function toggleFavoriteStory(evt) {
  console.debug("Toggle favorite");

  const $target = $(evt.target);

  const storyId = $target.closest("li").attr("id");
  const story = storyList.stories.find((s) => s.storyId === storyId);

  if ($target.hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $target.closest("i").toggleClass("far fas");
  } else {
    await currentUser.addFavorite(story);
    $target.closest("i").toggleClass("far fas");
  }
}

$allStoriesList.on("click", ".star", toggleFavoriteStory);

async function removeStory(evt) {
  console.debug("Remove story");

  const $target = $(evt.target);
  const storyId = $target.closest("li").attr("id");

  await storyList.deleteStory(currentUser, storyId);

  putStoriesOnPage();
}
$allStoriesList.on("click", ".trash-can", removeStory);
