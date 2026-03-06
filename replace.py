import os
import glob

html_dir = r"c:\Users\Admin\Documents\Projects\Project - NeuroSync\html"
for fp in glob.glob(os.path.join(html_dir, "*.html")):
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content.replace('href="Dashboard.html"', 'href="dashboard.html"')
    new_content = new_content.replace('href="#about"', 'href="about.html"')
    new_content = new_content.replace('href="#support"', 'href="feedback.html"')
    
    if new_content != content:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated", fp)
