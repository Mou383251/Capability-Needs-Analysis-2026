/**
 * exportOfficialReport
 * Captures a DOM element by its ID and generates a High-Fidelity PDF using html2pdf.
 * Configured for Multi-Page support with Blob-based rendering.
 */
export const exportOfficialReport = async (elementId: string, reportName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`High-Fidelity Export Error: Element with ID "${elementId}" not found.`);
    return;
  }

  // 1. PRE-CAPTURE PREPARATION: Force scroll to top to prevent offset issues
  // Scroll the entire window and the target element to (0,0)
  window.scrollTo(0, 0);
  element.scrollTo(0, 0);
  
  // 2. DELAY FOR RENDERING: Ensure scroll has finished before snapshotting
  await new Promise(resolve => setTimeout(resolve, 150));

  // Detect orientation based on classes or logic
  const isPortrait = element.classList.contains('a4-portrait');
  const orientation = isPortrait ? 'portrait' : 'landscape';

  // Force height to auto and remove clipping during the capture phase
  const originalStyle = element.getAttribute('style') || '';
  element.style.height = 'auto';
  element.style.overflow = 'visible';

  // 3. CAPTURE CONFIGURATION
  const opt = {
    margin: 0,
    filename: `${reportName.replace(/\s+/g, '_')}_2026.pdf`,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 3, // High definition but optimized for faster generation
      useCORS: true, 
      letterRendering: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      scrollY: 0, // RIGID OFFSET FIX: Always capture from top
      windowWidth: 1200, // Standardize capture viewport for consistent layout calculation
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: orientation,
      compress: true,
      precision: 16
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.page-break-avoid' 
    }
  };

  try {
    // @ts-ignore (html2pdf is loaded globally via CDN)
    await window.html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("Critical Rendering Failure:", error);
    alert("High-Fidelity rendering error. Please check for large data payload timeouts.");
  } finally {
    // Restore original screen-view styles
    element.setAttribute('style', originalStyle);
  }
};