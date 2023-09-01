import os
import time
import pytest

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains

# Selenium will by default save drivers to ~/.cache/selenium
# To see the electron-app devtools version run:
#  navigator.appVersion.match(/.*Chrome\/([0-9\.]+)/)[1]


def wranglename(name):
    # Convert module name to id
    return name \
        .replace(" ", "_") \
        .replace("(", "_") \
        .replace(")", "_") \
        .replace("[", "_") \
        .replace("]", "_") \
        .lower()


@pytest.fixture(scope="session", autouse=True)
def GRAPEVNE():
    # Start GRAPEVNE and selenium listener
    options = Options()
    options.debugger_address = "localhost:9515"
    driver = webdriver.Chrome(options=options)  # start
    assert driver.title == "GRAPEVNE"
    return driver


@pytest.fixture(scope="session", autouse=True)
def GRAPEVNE_Repo(GRAPEVNE):
    # Select test repository
    driver = GRAPEVNE
    driver.find_element(By.ID, "btnBuilderSettings").click()
    Select(driver.find_element(By.ID, "selectBuilderSettingsRepositoryType")) \
        .select_by_visible_text("Local filesystem")
    driver.find_element(By.ID, "inputBuilderSettingsRepositoryURL") \
        .clear()
    driver.find_element(By.ID, "inputBuilderSettingsRepositoryURL") \
        .send_keys(os.getcwd() + "/tests/test-repo/")
    driver.find_element(By.ID, "inputBuilderSettingsEnvironmentVars") \
        .clear()
    driver.find_element(By.ID, "inputBuilderSettingsEnvironmentVars") \
        .send_keys("CONDA_SUBDIR=osx-64")  # Required for OSX arm processors
    driver.find_element(By.ID, "btnBuilderSettings").click()
    # Get modules list
    driver.find_element(By.ID, "btnBuilderGetModuleList").click()
    time.sleep(1)  # Wait for modules to load
    return driver


@pytest.mark.parametrize(
    "module,expected_file",
    [
        ("(single_modules) copy_shell", "results/out/data.csv"),
        ("(single_modules) copy_run", "results/out/data.csv"),
    ]
)
def test_BuildAndTest_SingleModule(module, expected_file, GRAPEVNE_Repo):
    driver = GRAPEVNE_Repo
    # Clear scene
    driver.find_element(By.ID, "btnBuilderClearScene").click()
    time.sleep(1)
    # Select module from repository listing; drag-drop onto canvas
    target_module = driver.find_element(
        By.ID,
        "modulelist-" + wranglename(module),
    )
    action = ActionChains(driver)
    action.drag_and_drop_by_offset(
        target_module,
        200, 0,
    ).perform()
    time.sleep(1)  # Wait for module to load
    # Delete test build (clear workspace)
    driver.find_element(By.ID, "btnBuilderCleanBuildFolder").click()
    time.sleep(10)  # Wait for cleanup to complete

    # ### Assert that expected file does not exist
    # ### (but what is the [temp] folder path??)

    # Build and test module
    driver.find_element(By.ID, "btnBuilderBuildAndTest").click()
    time.sleep(15)  # Wait for build and test to complete

    # ### Assert that expected file has been created successfully

    # Delete test build (cleanup workspace)
    driver.find_element(By.ID, "btnBuilderCleanBuildFolder").click()
    time.sleep(10)  # Wait for cleanup to complete

    # ### Assert that expected file has been cleaned up


def test_shutdown(GRAPEVNE_Repo):
    driver = GRAPEVNE_Repo
    # driver.close()  # close GRAPEVNE
    driver.quit()  # shutdown selenium


print("E")
