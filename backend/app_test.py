from app import main


def test_main():
    assert main() == "<p>GRAPEVNE flask server is running</p>"
