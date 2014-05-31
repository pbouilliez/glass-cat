#!/bin/sh
rm glass_cat.js
cat oz.js ast_nodes.js >> glass_cat.js
cp glass_cat.js ../front_end/js/glass_cat.js
echo "INFO: Start optimizing"
java -jar ../../closure-compiler/compiler.jar --js glass_cat.js --js_output_file glass_cat-min.js
cp glass_cat-min.js ../front_end/js/glass_cat-min.js
echo "INFO: Start developers version"
python dev.py
cp glass_cat_dev.js ../front_end/js/glass_cat_dev.js
rm glass_cat_dev.js
cp glass_cat_dev-min.js ../front_end/js/glass_cat_dev-min.js
rm glass_cat_dev-min.js
echo "INFO: Done!"