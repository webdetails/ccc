
echo -e "CCC Extension Points\n\n" > cccExtensionPoints.txt

grep this.extend src/pvc/pvc* | sed -e 's/this.extend(this[^"]*"\([^"]*\).*/\1/' -e 's#src/pvc/pvc##' -e 's/\.js//' >> cccExtensionPoints.txt
