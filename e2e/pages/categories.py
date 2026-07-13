from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

from .base import (
    click_button,
    click_link,
    fill,
    wait_for,
    wait_for_clickable,
    wait_for_text,
    wait_for_text_absent,
    xpath_literal,
)


def open_categories(driver: WebDriver) -> None:
    click_link(driver, "Categories")
    wait_for(driver, By.XPATH, "//h1[normalize-space(.) = 'Categories']")


def create_category(driver: WebDriver, name: str) -> None:
    fill(driver, "//*[@id='new-category-name']", name)
    click_button(driver, "Create")
    wait_for_text(driver, name)
    wait_for_text(driver, "1 category")


def rename_category(driver: WebDriver, old_name: str, new_name: str) -> None:
    edit_button = wait_for_clickable(
        driver,
        By.XPATH,
        f"//button[@aria-label = {xpath_literal(f'Edit {old_name}')}]",
    )
    driver.execute_script("arguments[0].click();", edit_button)
    fill(driver, "//input[starts-with(@id, 'category-name-')]", new_name)

    save_button = wait_for_clickable(
        driver,
        By.XPATH,
        f"//button[@aria-label = {xpath_literal(f'Save {old_name}')}]",
    )
    driver.execute_script("arguments[0].click();", save_button)
    wait_for_text(driver, new_name)
    wait_for_text_absent(driver, old_name)


def delete_category(driver: WebDriver, name: str) -> None:
    delete_button = wait_for_clickable(
        driver,
        By.XPATH,
        f"//button[@aria-label = {xpath_literal(f'Delete {name}')}]",
    )
    driver.execute_script("arguments[0].click();", delete_button)
    wait_for_text(driver, f"Delete “{name}”?")
    click_button(driver, "Delete category")
    wait_for_text_absent(driver, name)
    wait_for_text(driver, "0 categories")
    wait_for_text(driver, "No categories yet. Create one above to get started.")
