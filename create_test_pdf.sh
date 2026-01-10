#!/usr/bin/env bash
# Create a test PDF with 2 versions (incremental update)

# Create initial PDF (version 1)
cat > test_2versions.pdf <<'PDF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT
/F1 12 Tf
50 700 Td
(Version 1 - Original) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000271 00000 n 
0000000375 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
453
%%EOF
PDF

# Append incremental update (version 2)
cat >> test_2versions.pdf <<'PDF'
% Incremental Update - Version 2
6 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
7 0 obj
<< /Length 70 >>
stream
BT
/F1 12 Tf
50 700 Td
(Version 2 - Updated with secret text) Tj
ET
endstream
endobj
2 0 obj
<< /Type /Pages /Kids [6 0 R] /Count 1 >>
endobj
xref
0 1
0000000000 65535 f 
2 1
0000000667 00000 n 
6 2
0000000496 00000 n 
0000000642 00000 n 
trailer
<< /Size 8 /Root 1 0 R /Prev 453 >>
startxref
728
%%EOF
PDF

echo "Created test_2versions.pdf with 2 incremental versions"
ls -lh test_2versions.pdf
