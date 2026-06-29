from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait

from .base import (
    click_button,
    click_link,
    fill,
    wait_for,
    wait_for_clickable,
    wait_for_text,
    wait_for_text_absent,
    TIMEOUT,
)

_DRAFT_CHECKBOX_XPATH = (
    "//input[@type='checkbox' and contains(@aria-label, 'for save')]"
)


def open_generate_studio(driver: WebDriver) -> None:
    click_link(driver, "Generate")
    wait_for_text(driver, "Generate Studio")


def start_generating(driver: WebDriver, *, api_key: str, prompt: str) -> None:
    fill(driver, "//*[@id='api-key']", api_key)
    fill(driver, "//*[@id='prompt']", prompt)
    click_button(driver, "+ Generate cards")


def assert_button_is_loading(driver: WebDriver) -> None:
    wait_for_text(driver, "Generating...")


def wait_for_generation_complete(driver: WebDriver, timeout: int = 60) -> None:
    wait_for_text_absent(driver, "Generating...", timeout=timeout)


def wait_for_generated_cards(
    driver: WebDriver, min_count: int = 1, timeout: int = 60
) -> None:
    WebDriverWait(driver, timeout).until(
        lambda d: len(d.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH)) >= min_count
    )


def get_generated_card_count(driver: WebDriver) -> int:
    return len(driver.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH))


def _get_draft_row(driver: WebDriver, index: int):
    return wait_for(
        driver,
        By.XPATH,
        f"//input[@aria-label='Select card {index + 1} for save']/ancestor::tr[1]",
    )


def edit_generated_card(driver: WebDriver, index: int, *, new_front: str) -> None:
    row = _get_draft_row(driver, index)
    edit_btn = row.find_element(By.XPATH, ".//button[normalize-space(.) = 'Edit']")
    driver.execute_script("arguments[0].click();", edit_btn)
    wait_for_text(driver, "Edit generated card")
    fill(driver, "//*[@id='card-front']", new_front)
    click_button(driver, "Save")
    wait_for_text(driver, new_front)


def discard_generated_card(
    driver: WebDriver, index: int, *, expected_count: int | None = None
) -> None:
    row = _get_draft_row(driver, index)
    discard_btn = row.find_element(
        By.XPATH, ".//button[normalize-space(.) = 'Discard']"
    )
    driver.execute_script("arguments[0].click();", discard_btn)
    if expected_count is not None:
        WebDriverWait(driver, TIMEOUT).until(
            lambda d: len(d.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH))
            == expected_count
        )


def select_generated_card(driver: WebDriver, index: int) -> None:
    checkbox = wait_for(
        driver,
        By.XPATH,
        f"//input[@type='checkbox' and @aria-label='Select card {index + 1} for save']",
    )
    if not checkbox.is_selected():
        driver.execute_script("arguments[0].click();", checkbox)
    
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.find_element(
            By.XPATH,
            f"//input[@type='checkbox' and @aria-label='Select card {index + 1} for save']",
        ).is_selected()
    )


def select_all_generated_cards(driver: WebDriver) -> None:
    click_button(driver, "Select all")

    WebDriverWait(driver, TIMEOUT).until(
        lambda d: all(
            cb.is_selected()
            for cb in d.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH)
        )
    )


def clear_generated_card_selection(driver: WebDriver) -> None:
    click_button(driver, "Clear selection")

    WebDriverWait(driver, TIMEOUT).until(
        lambda d: not any(
            cb.is_selected()
            for cb in d.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH)
        )
    )


def discard_selected_generated_cards(driver: WebDriver) -> None:
    count_before = get_generated_card_count(driver)
    click_button(driver, "Discard selected")

    WebDriverWait(driver, TIMEOUT).until(
        lambda d: len(d.find_elements(By.XPATH, _DRAFT_CHECKBOX_XPATH)) < count_before
    )


def save_selected_generated_cards(driver: WebDriver) -> None:
    save_btn = wait_for_clickable(
        driver,
        By.XPATH,
        "//button[normalize-space(.) = 'Save selected cards']",
    )
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        save_btn,
    )
    driver.execute_script("arguments[0].click();", save_btn)
    wait_for_text(driver, "Saved")
