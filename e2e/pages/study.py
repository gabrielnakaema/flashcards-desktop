from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

from .base import (
    click_button,
    click_link,
    fill,
    wait_for,
    wait_for_clickable,
    wait_for_text,
    xpath_literal,
)


def start_study(driver: WebDriver) -> None:
    click_link(driver, "Study")
    wait_for_text(driver, "I don't know")


def _click_rating(driver: WebDriver, shortcut: str) -> None:
    button = wait_for_clickable(
        driver,
        By.XPATH,
        f"//button[@aria-keyshortcuts='{shortcut}']",
    )
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        button,
    )
    driver.execute_script("arguments[0].click();", button)


def review_plain_card_as_easy(driver: WebDriver, *, expected_back: str) -> None:
    click_button(driver, "Show answer")
    wait_for_text(driver, expected_back)
    _click_rating(driver, "4")
    wait_for_text(driver, "Study session complete")
    wait_for_text(driver, "Reviewed")
    wait_for_text(driver, "Correct")


def answer_multiple_choice(driver: WebDriver, *, choice_text: str) -> None:
    button = wait_for(
        driver,
        By.XPATH,
        f"//button[.//span[normalize-space(.) = {xpath_literal(choice_text)}]]",
    )
    driver.execute_script("arguments[0].click();", button)
    wait_for_text(driver, "Correct")
    _click_rating(driver, "4")
    wait_for_text(driver, "Study session complete")


def answer_typed_card(driver: WebDriver, *, answer: str) -> None:
    fill(driver, "//*[@id='study-typed-answer']", answer)
    click_button(driver, "Submit")
    wait_for_text(driver, "Correct")
    _click_rating(driver, "4")
    wait_for_text(driver, "Study session complete")
