import os
import sqlite3

import pytest
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait

from e2e.pages.base import TIMEOUT, wait_for_text


WEBDRIVER_URL = os.getenv("WEBDRIVER_URL", "http://127.0.0.1:4445")
APP_URL = os.getenv("APP_URL", "http://localhost:1420")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
DB_PATH = os.path.expanduser(os.getenv("E2E_DB_PATH", "").strip('"\''))


def wait_for_app(driver: webdriver.Remote) -> None:
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.execute_script(
            """
            return !document.querySelector("#root[data-e2e-stale]")
              && typeof window.__TAURI_INTERNALS__?.invoke === "function"
              && Boolean(document.querySelector("#root > *"));
            """
        ),
    )


def reset_app_state(driver: webdriver.Remote) -> None:
    if not DB_PATH:
        raise AssertionError("E2E_DB_PATH environment variable is not set")
    
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = OFF")
        for table in ["review_logs", "card_schedules", "cards", "decks", "deck_categories"]:
            conn.execute(f"DELETE FROM {table}")
        conn.execute("PRAGMA foreign_keys = ON")

    driver.execute_script(
        "localStorage.removeItem('flashcards:settings');"
        "document.querySelector('#root')?.setAttribute('data-e2e-stale', '1');"
    )
    driver.get(APP_URL)
    wait_for_app(driver)


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    driver = webdriver.Remote(command_executor=WEBDRIVER_URL, options=options)
    driver.set_window_size(1440, 1000)
    try:
        wait_for_app(driver)
        yield driver
    finally:
        driver.quit()


@pytest.fixture
def llm_api_key() -> str:
    if not LLM_API_KEY:
        pytest.skip("LLM_API_KEY env variable not set — skipping generation test")
    return LLM_API_KEY


@pytest.fixture
def clean_app(driver: webdriver.Remote):
    reset_app_state(driver)
    wait_for_text(driver, "Create your first deck")
    return driver
