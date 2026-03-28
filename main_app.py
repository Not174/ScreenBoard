import os
import sys
import webview

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))

    return os.path.join(base_path, relative_path)

def main():
    # The index.html is in the same directory as this script (or bundled in _MEIPASS)
    html_file = get_resource_path("index.html")
    
    if not os.path.exists(html_file):
        print(f"File not found: {html_file}")
        sys.exit(1)

    # Create a pywebview window
    window = webview.create_window(
        'Whiteboard App', 
        html_file, 
        width=1200, 
        height=800,
        resizable=True,
        min_size=(800, 600)
    )
    
    # Start the engine
    webview.start()

if __name__ == '__main__':
    main()
