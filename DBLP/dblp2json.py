################################################################################
### @brief Doxygen XML to Markdown
###
### @file
###
### DISCLAIMER
###
### Copyright by triAGENS GmbH - All rights reserved.
###
### The Programs (which include both the software and documentation)
### contain proprietary information of triAGENS GmbH; they are
### provided under a license agreement containing restrictions on use and
### disclosure and are also protected by copyright, patent and other
### intellectual and industrial property laws. Reverse engineering,
### disassembly or decompilation of the Programs, except to the extent
### required to obtain interoperability with other independently created
### software or as specified by law, is prohibited.
###
### The Programs are not intended for use in any nuclear, aviation, mass
### transit, medical, or other inherently dangerous applications. It shall
### be the licensee's responsibility to take all appropriate fail-safe,
### backup, redundancy, and other measures to ensure the safe use of such
### applications if the Programs are used for such purposes, and triAGENS
### GmbH disclaims liability for any damages caused by such use of
### the Programs.
###
### This software is the confidential and proprietary information of
### triAGENS GmbH. You shall not disclose such confidential and
### proprietary information and shall use it only in accordance with the
### terms of the license agreement you entered into with triAGENS GmbH.
###
### Copyright holder is triAGENS GmbH, Cologne, Germany
###
### @author Dr. Frank Celler
### @author Dr. Wolfgang Helisch
### @author Copyright 2011-2013, triagens GmbH, Cologne, Germany
################################################################################

import re, sys, xml.parsers.expat, json

file_name = sys.argv[1]

## -----------------------------------------------------------------------------
## --SECTION--                                                  global variables
## -----------------------------------------------------------------------------

################################################################################
### @brief current type
################################################################################

current_type = ""

################################################################################
### @brief top-level type
################################################################################

main_type = ""

################################################################################
### @brief current article or book
################################################################################

article = {}

################################################################################
### @brief current text
################################################################################

text = ""

################################################################################
### @brief top-level types
################################################################################

tlf_types = [
    "article",
    "book",
    "editor",
    "incollection",
    "inproceedings",
    "mastersthesis",
    "phdthesis",
    "proceedings",
    "www",
    ]

################################################################################
### @brief list tags
################################################################################

list_tags = [
    "author",
    "booktitle",
    "cdrom",
    "cite",
    "crossref",
    "editor",
    "ee",
    "isbn",
    "note",
    "publisher",
    "school",
    "series",
    "url",
    "year",
    ]

################################################################################
### @brief list tags which are flatten if single
################################################################################

flatten_tags = [
    "booktitle",
    "ee",
    "isbn",
    "publisher",
    "url",
    "year",
    ]

## -----------------------------------------------------------------------------
## --SECTION--                                                  global functions
## -----------------------------------------------------------------------------

################################################################################
### @brief start element
################################################################################

def start_element(name, attrs):
    global current_type, main_type, article, text, tlf_types, list_tags

    text = ""

    if name == "dblp":
        current_type = name
        main_type = name
        return

    if current_type == "dblp" and name in tlf_types:
        current_type = name
        main_type = name
        article = {}
        article['type'] = name

        for key in [ "mdate", "key", "publtype" ]:
            if key in attrs:
                article[key] = attrs[key]

        for lt in list_tags:
            article[lt] = []

        return

    if main_type == "dblp":
        print >> sys.stderr, "WARNING: unknown top-level tag '%s' (main %s, current %s)" % (name,main_type,current_type)
        return

    if name == "sub" or name == "sup" or name == "i" or name == "tt":
        text = text + "<" + name + ">"
        return
    
    if name == "author" or name == "editor":
        current_type = name
        return

    if name == "publisher":
        current_type = name
        return

    if name == "title" or name == "booktitle":
        current_type = name
        return

    if name == "journal" or name == "volume" or name == "series" or name == "school":
        current_type = name
        return

    if name == "month" or name == "year" or name == "address":
        current_type = name
        return

    if name == "cdrom" or name == "ee" or name == "url" or name == "note" or name == "isbn" or name == "note":
        current_type = name
        return

    if name == "pages" or name == "number" or name == "cite" or name == "crossref" or name == "chapter":
        current_type = name
        return

    print >> sys.stderr, "WARNING: unknown tag '%s'" % name
#enddef

################################################################################
### @brief end element
################################################################################

def end_element(name):
    global current_type, main_type, article, text, tlf_types, list_tags

    if name == "sub" or name == "sup" or name == "i" or name == "tt":
        text = text + "</" + name + ">"
        return
    
    if main_type in tlf_types and name == main_type:
        main_type = "dblp"
        current_type = "dblp"

        for key in list_tags:
            if len(article[key]) == 0:
                del article[key]
            elif len(article[key]) == 1 and key in flatten_tags:
                article[key] = article[key][0]

        article['_key'] = article['key']
        del article['key']

        print "%s" % json.dumps(article)
        return

    if current_type is None:
        return

    text = text.strip()

    if current_type in list_tags:
        if current_type != "cite" or text != "...":
            article[current_type].append(text)
    else:
        if current_type in article:
            print >> sys.stderr, "WARNING: duplicate tag '%s'" % current_type

        article[current_type] = text

    current_type = None
#enddef

################################################################################
### @brief handle text
################################################################################

def char_data(data):
    global text
    
    text = text + data;
#enddef

################################################################################
### @brief parse file
################################################################################

p = xml.parsers.expat.ParserCreate()

p.buffer_text = True
p.returns_unicode = False
p.StartElementHandler = start_element
p.EndElementHandler = end_element
p.CharacterDataHandler = char_data

f = open(file_name, "r")
p.ParseFile(f)
f.close()

## -----------------------------------------------------------------------------
## --SECTION--                                                       END-OF-FILE
## -----------------------------------------------------------------------------

## Local Variables:
## mode: outline-minor
## outline-regexp: "^\\(### @brief\\|## --SECTION--\\|# -\\*- \\)"
## End:
