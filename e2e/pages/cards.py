from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

from .base import (
    click_button,
    fill,
    select_option,
    wait_for,
    wait_for_clickable,
    wait_for_text,
    wait_for_text_absent,
)


def open_create_card_dialog(driver: WebDriver) -> None:
    button = wait_for_clickable(
        driver,
        By.XPATH,
        "//button[normalize-space(.) = 'Create first flashcard'"
        " or normalize-space(.) = 'New card']",
    )
    driver.execute_script("arguments[0].click();", button)
    wait_for_text(driver, "Create flashcard")


def create_plain_card(
    driver: WebDriver,
    *,
    front: str,
    back: str,
    difficulty: str = "Easy",
    tags: str = "plain",
) -> None:
    open_create_card_dialog(driver)
    fill(driver, "//*[@id='card-front']", front)
    fill(driver, "//*[@id='card-back']", back)
    select_option(driver, "//*[@id='card-difficulty']", difficulty)
    fill(driver, "//*[@id='card-tags']", tags)
    click_button(driver, "Create")
    wait_for_text(driver, front)
    wait_for_text(driver, back)


def create_multiple_choice_card(
    driver: WebDriver,
    *,
    front: str,
    first_choice: str,
    second_choice: str,
    correct_choice_label: str,
) -> None:
    open_create_card_dialog(driver)
    select_option(driver, "//*[@id='card-type']", "Multiple choice")
    fill(driver, "//*[@id='card-front']", front)
    fill(driver, "//*[@id='card-choice-0']", first_choice)
    fill(driver, "//*[@id='card-choice-1']", second_choice)
    select_option(driver, "//*[@id='card-correct-choice']", correct_choice_label)
    click_button(driver, "Create")
    wait_for_text(driver, front)
    wait_for_text(driver, first_choice)


def create_typed_answer_card(
    driver: WebDriver,
    *,
    front: str,
    accepted_answer: str,
    aliases: str = "",
) -> None:
    open_create_card_dialog(driver)
    select_option(driver, "//*[@id='card-type']", "Typed answer")
    fill(driver, "//*[@id='card-front']", front)
    fill(driver, "//*[@id='card-accepted-answer']", accepted_answer)
    if aliases:
        fill(driver, "//*[@id='card-aliases']", aliases)
    click_button(driver, "Create")
    wait_for_text(driver, front)
    wait_for_text(driver, accepted_answer)


def edit_first_card(driver: WebDriver, *, new_front: str, new_back: str) -> None:
    button = wait_for(driver, By.XPATH, "//button[@aria-label='Edit card']")
    driver.execute_script("arguments[0].click();", button)
    wait_for_text(driver, "Edit flashcard")
    fill(driver, "//*[@id='card-front']", new_front)
    fill(driver, "//*[@id='card-back']", new_back)
    click_button(driver, "Save")
    wait_for_text(driver, new_front)
    wait_for_text(driver, new_back)


def delete_first_card(driver: WebDriver, *, removed_text: str) -> None:
    button = wait_for(driver, By.XPATH, "//button[@aria-label='Delete card']")
    driver.execute_script("arguments[0].click();", button)
    wait_for_text(driver, "Are you sure you want to delete this flashcard?")
    click_button(driver, "Delete")
    wait_for_text_absent(driver, removed_text)
