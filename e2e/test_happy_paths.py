from e2e.pages import cards, decks, settings, study
from e2e.pages import generate
from e2e.pages.base import wait_for_text


def test_app_shell_empty_state(clean_app):
    driver = clean_app

    assert "Flashcards" in driver.title
    wait_for_text(driver, "flashcards.")
    wait_for_text(driver, "Home")
    wait_for_text(driver, "Review")
    wait_for_text(driver, "Settings")
    wait_for_text(driver, "No decks yet")
    wait_for_text(driver, "Create your first deck")


def test_deck_create_and_edit_happy_path(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Biology", tags="cells, e2e", category="Science")
    decks.open_deck_cards(driver, "E2E Biology")
    decks.edit_deck(driver, "E2E Biology Updated")

    wait_for_text(driver, "E2E Biology Updated")
    wait_for_text(driver, "updated")


def test_plain_card_create_edit_delete_happy_path(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Plain Cards", category="Cards")
    decks.open_deck_cards(driver, "E2E Plain Cards")

    cards.create_plain_card(
        driver,
        front="What does ATP stand for?",
        back="Adenosine triphosphate",
    )
    cards.edit_first_card(
        driver,
        new_front="What molecule stores cellular energy?",
        new_back="ATP",
    )
    cards.delete_first_card(driver, removed_text="What molecule stores cellular energy?")


def test_create_multiple_choice_and_typed_answer_cards(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Mixed Cards", category="Cards")
    decks.open_deck_cards(driver, "E2E Mixed Cards")

    cards.create_multiple_choice_card(
        driver,
        front="Which database does this app use locally?",
        first_choice="SQLite",
        second_choice="Redis",
        correct_choice_label="A: SQLite",
    )
    cards.create_typed_answer_card(
        driver,
        front="Which framework wraps the desktop app?",
        accepted_answer="Tauri",
        aliases="tauri",
    )

    wait_for_text(driver, "Which database does this app use locally?")
    wait_for_text(driver, "Which framework wraps the desktop app?")


def test_study_plain_card_happy_path(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Study Plain", category="Study")
    decks.open_deck_cards(driver, "E2E Study Plain")
    cards.create_plain_card(
        driver,
        front="Capital of France?",
        back="Paris",
    )

    study.start_study(driver)
    wait_for_text(driver, "Capital of France?")
    study.review_plain_card_as_easy(driver, expected_back="Paris")


def test_study_multiple_choice_happy_path(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Study Choice", category="Study")
    decks.open_deck_cards(driver, "E2E Study Choice")
    cards.create_multiple_choice_card(
        driver,
        front="2 + 2 = ?",
        first_choice="4",
        second_choice="5",
        correct_choice_label="A: 4",
    )

    study.start_study(driver)
    wait_for_text(driver, "2 + 2 = ?")
    study.answer_multiple_choice(driver, choice_text="4")


def test_study_typed_answer_happy_path(clean_app):
    driver = clean_app

    decks.create_deck(driver, "E2E Study Typed", category="Study")
    decks.open_deck_cards(driver, "E2E Study Typed")
    cards.create_typed_answer_card(
        driver,
        front="Name the Tauri frontend framework used here.",
        accepted_answer="React",
        aliases="react",
    )

    study.start_study(driver)
    wait_for_text(driver, "Name the Tauri frontend framework used here.")
    study.answer_typed_card(driver, answer="React")


def test_settings_persistence_happy_path(clean_app):
    saved = settings.save_api_settings(clean_app, api_key="sk-e2e-placeholder")

    assert saved["apiKey"] == "sk-e2e-placeholder"
    assert saved["saveApiSettings"] is True


def test_generate_review_workflow(clean_app, llm_api_key):
    driver = clean_app

    decks.create_deck(driver, "E2E Generate", category="Generate")
    decks.open_deck_cards(driver, "E2E Generate")
    generate.open_generate_studio(driver)

    generate.start_generating(
        driver,
        api_key=llm_api_key,
        prompt="Generate 3 flashcards about the water cycle",
    )
    generate.assert_button_is_loading(driver)

    generate.wait_for_generation_complete(driver)
    generate.wait_for_generated_cards(driver, min_count=1)
    assert generate.get_generated_card_count(driver) >= 1

    generate.edit_generated_card(driver, 0, new_front="Edited: What is the water cycle?")

    count = generate.get_generated_card_count(driver)
    generate.discard_generated_card(driver, 0, expected_count=count - 1)

    if generate.get_generated_card_count(driver) >= 1:
        generate.select_all_generated_cards(driver)
        generate.clear_generated_card_selection(driver)

        generate.select_generated_card(driver, 0)
        generate.discard_selected_generated_cards(driver)

    if generate.get_generated_card_count(driver) >= 1:
        generate.select_all_generated_cards(driver)
        generate.save_selected_generated_cards(driver)
