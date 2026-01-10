/*
 * Minimal WASM compilation test for pdfresurrect
 * Tests that we can compile C code to WASM and call it from JavaScript
 *
 * Function: Count %%EOF markers in PDF data (indicates number of versions)
 */

#include <string.h>

// Simple function to count %%EOF markers
// Each incremental update adds a %%EOF, so count = number of versions
int pdf_count_versions(const char* data, int length) {
    if (!data || length < 5) {
        return 0;
    }

    int count = 0;
    const char* marker = "%%EOF";

    // Scan through data looking for %%EOF markers
    for (int i = 0; i <= length - 5; i++) {
        if (strncmp(&data[i], marker, 5) == 0) {
            count++;
        }
    }

    return count;
}

// Test function - verify WASM integration works
int test_add(int a, int b) {
    return a + b;
}
