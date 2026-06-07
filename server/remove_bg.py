#!/usr/bin/env python3
"""
Remove background from an image using rembg.
Usage: python remove_bg.py <input_image_path>
Output: raw PNG bytes written to stdout.
"""
import sys

try:
    from rembg import remove
except ImportError:
    sys.stderr.write("Error: rembg is not installed. Run: pip install rembg[cli]\n")
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python remove_bg.py <input_image_path>\n")
        sys.exit(1)

    input_path = sys.argv[1]
    try:
        with open(input_path, "rb") as f:
            input_data = f.read()
        output_data = remove(input_data)
        sys.stdout.buffer.write(output_data)
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
