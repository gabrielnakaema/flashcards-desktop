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


def create_category(driver: WebDriver, name: str) -> None:
    trigger = wait_for_clickable(driver, By.XPATH, "//*[@id='category']")
    driver.execute_script("arguments[0].click();", trigger)
    fill(driver, "//input[@cmdk-input]", name)
    item = wait_for(
        driver,
        By.XPATH,
        f"//*[@role='option' and contains(normalize-space(.), {xpath_literal(name)})]",
    )
    driver.execute_script("arguments[0].click();", item)
    wait_for_text(driver, name)


def create_deck(
    driver: WebDriver,
    title: str,
    *,
    tags: str = "e2e",
    category: str = "E2E",
) -> None:
    click_link(driver, "Create deck")
    wait_for_text(driver, "New deck")
    fill(driver, "//*[@id='title']", title)
    fill(driver, "//*[@id='tags']", tags)
    create_category(driver, category)
    click_button(driver, "Create deck")
    wait_for_text(driver, title)


def open_deck_cards(driver: WebDriver, title: str) -> None:
    link = wait_for(
        driver,
        By.XPATH,
        f"//a[.//span[normalize-space(.) = {xpath_literal(title)}]]",
    )
    driver.execute_script("arguments[0].click();", link)
    wait_for(driver, By.XPATH, f"//h1[normalize-space(.) = {xpath_literal(title)}]")


def edit_deck(
    driver: WebDriver,
    new_title: str,
    *,
    new_tags: str = "updated, e2e",
) -> None:
    click_link(driver, "Edit deck")
    wait_for_text(driver, "Edit deck")
    fill(driver, "//*[@id='title']", new_title)
    fill(driver, "//*[@id='tags']", new_tags)
    click_button(driver, "Save deck")
    wait_for_text(driver, new_title)
