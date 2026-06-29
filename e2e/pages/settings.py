import json

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

from .base import click_button, click_link, fill, wait_for_clickable, wait_for_text


SETTINGS_STORAGE_KEY = "flashcards:settings"


def save_api_settings(driver: WebDriver, *, api_key: str) -> dict:
    click_link(driver, "Settings")
    wait_for_text(driver, "LLM Provider")
    fill(driver, "//*[@id='api-key']", api_key)
    switch = wait_for_clickable(driver, By.XPATH, "//*[@id='save-api-settings']")
    if switch.get_attribute("aria-checked") != "true":
        driver.execute_script("arguments[0].click();", switch)
    click_button(driver, "Save")

    raw = driver.execute_script(
        "return window.localStorage.getItem(arguments[0]);",
        SETTINGS_STORAGE_KEY,
    )
    assert raw, "Expected settings to be persisted to localStorage"
    return json.loads(raw)
