import os

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


TIMEOUT = int(os.getenv("E2E_TIMEOUT", "10"))


def xpath_literal(value: str) -> str:
    if '"' not in value:
        return f'"{value}"'
    if "'" not in value:
        return f"'{value}'"
    parts = value.split('"')
    return "concat(" + ', \'"\', '.join(f'"{part}"' for part in parts) + ")"


def wait_for(driver: WebDriver, by: str, value: str, timeout: int = TIMEOUT) -> WebElement:
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_for_clickable(
    driver: WebDriver, by: str, value: str, timeout: int = TIMEOUT
) -> WebElement:
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def wait_for_text(driver: WebDriver, text: str, timeout: int = TIMEOUT) -> None:
    WebDriverWait(driver, timeout).until(
        lambda d: text in d.find_element(By.TAG_NAME, "body").text
    )


def wait_for_text_absent(driver: WebDriver, text: str, timeout: int = TIMEOUT) -> None:
    WebDriverWait(driver, timeout).until(
        lambda d: text not in d.find_element(By.TAG_NAME, "body").text
    )


def click_button(driver: WebDriver, text: str) -> None:
    button = wait_for_clickable(
        driver,
        By.XPATH,
        f"//button[normalize-space(.) = {xpath_literal(text)}]",
    )
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        button,
    )
    driver.execute_script("arguments[0].click();", button)


def click_link(driver: WebDriver, text: str) -> None:
    link = wait_for_clickable(
        driver,
        By.XPATH,
        f"//a[normalize-space(.) = {xpath_literal(text)}]",
    )
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        link,
    )
    driver.execute_script("arguments[0].click();", link)


def fill(driver: WebDriver, xpath: str, value: str) -> WebElement:
    field = wait_for(driver, By.XPATH, xpath)
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        field,
    )
    field.click()
    field.clear()
    field.send_keys(value)
    return field


def select_option(driver: WebDriver, trigger_xpath: str, option_text: str) -> None:
    trigger = wait_for_clickable(driver, By.XPATH, trigger_xpath)
    driver.execute_script(
        "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
        trigger,
    )
    driver.execute_script("arguments[0].click();", trigger)
    option = wait_for(
        driver,
        By.XPATH,
        f"//*[@role = 'option' and normalize-space(.) = {xpath_literal(option_text)}]",
    )
    driver.execute_script("arguments[0].click();", option)
