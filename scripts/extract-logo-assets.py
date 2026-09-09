"""Extract browser-ready GHOSTER logo SVGs from the supplied vector PDF.

The PDF contains the official distress masks and tricolour emblem accents. This
script keeps those paths intact while removing only the PDF's black page.
"""

from __future__ import annotations

import copy
import re
from pathlib import Path
from xml.etree import ElementTree as ET

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reference" / "GHOSTER-original-logo.pdf"
OUTPUT = ROOT / "public" / "assets"
SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"
INKSCAPE_NS = "http://www.inkscape.org/namespaces/inkscape"
REFERENCE_RE = re.compile(r"(?:url\()?#[A-Za-z0-9_.:-]+")

ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK_NS)
ET.register_namespace("inkscape", INKSCAPE_NS)


def references(node: ET.Element) -> set[str]:
    found: set[str] = set()
    for element in node.iter():
        for value in element.attrib.values():
            for match in REFERENCE_RE.findall(value):
                found.add(match.removeprefix("url(").removeprefix("#").removesuffix(")"))
    return found


def make_svg(source_root: ET.Element, nodes: list[ET.Element], view_box: str, width: str, height: str) -> ET.Element:
    source_defs = source_root.find(f"{{{SVG_NS}}}defs")
    if source_defs is None:
        raise RuntimeError("The supplied logo PDF did not produce SVG definitions.")

    definitions = {element.attrib["id"]: element for element in source_defs if "id" in element.attrib}
    required: set[str] = set()
    pending = set().union(*(references(node) for node in nodes))
    while pending:
        identifier = pending.pop()
        if identifier in required:
            continue
        required.add(identifier)
        definition = definitions.get(identifier)
        if definition is not None:
            pending.update(references(definition) - required)

    output_root = ET.Element(f"{{{SVG_NS}}}svg", {
        "version": "1.1",
        "viewBox": view_box,
        "width": width,
        "height": height,
        "role": "img",
        "aria-label": "GHOSTER",
    })
    output_defs = ET.SubElement(output_root, f"{{{SVG_NS}}}defs")
    for definition in source_defs:
        if definition.attrib.get("id") in required:
            output_defs.append(copy.deepcopy(definition))
    for node in nodes:
        output_root.append(copy.deepcopy(node))
    return output_root


def write_svg(filename: str, root: ET.Element) -> None:
    path = OUTPUT / filename
    ET.ElementTree(root).write(path, encoding="unicode", xml_declaration=False, short_empty_elements=True)
    text = path.read_text(encoding="utf-8")
    path.write_text(text.replace(" />", "/>"), encoding="utf-8", newline="\n")


def main() -> None:
    document = pymupdf.open(SOURCE)
    try:
        source_root = ET.fromstring(document[0].get_svg_image())
    finally:
        document.close()

    page_group = list(source_root)[1]
    layer = list(page_group)[0]
    artwork_group = list(layer)[21]
    wordmark = list(artwork_group)[0]
    emblem = list(artwork_group)[1]
    tagline = list(layer)[1:21]

    write_svg("brand-mark.svg", make_svg(source_root, [emblem], "69.06 93.69 199.31 173.06", "199", "173"))
    write_svg("brand-wordmark.svg", make_svg(source_root, [wordmark], "23.43 282.34 335.82 38.83", "336", "39"))
    write_svg("brand-logo.svg", make_svg(source_root, [*tagline, artwork_group], "22.93 93.69 336.82 255.40", "337", "255"))


if __name__ == "__main__":
    main()
