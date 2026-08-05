"""Stylinger — AI Fashion Assistant (CG/IP Academic Project).

Main execution entry point for launching the PyQt5 Graphical User Interface
and image processing pipeline studio.
"""

import sys
import logging
from PyQt5.QtWidgets import QApplication
from gui.main_window import MainWindow

# Configure global logging formatting
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("StylingerMain")


def main() -> None:
    """Initializes the PyQt5 application context, displays MainWindow, and starts event loop."""
    logger.info("Initializing Stylinger CG/IP Application...")

    # Create PyQt5 Application Instance
    app = QApplication(sys.argv)
    app.setApplicationName("Stylinger")
    app.setOrganizationName("Stylinger CG/IP Studio")

    try:
        # Instantiate Main Desktop Window
        window = MainWindow()
        window.show()
        logger.info("MainWindow initialized and displayed successfully.")

        # Start PyQt Qt Event Loop
        sys.exit(app.exec_())

    except Exception as err:
        logger.critical("Fatal error encountered during runtime: %s", err, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
