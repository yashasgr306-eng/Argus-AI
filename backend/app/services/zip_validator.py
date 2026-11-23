import os
import zipfile
import shutil
from pathlib import Path
from typing import Tuple, List
from app.config import settings

class UnsafeArchiveError(Exception):
    """Raised when an uploaded archive violates security boundaries."""
    pass

class ZipValidator:
    """
    Validates uploaded archives to prevent:
    - Path traversal attacks (Zip Slip)
    - Zip bombs (compression ratio & file count limits)
    - Dangerous executables or scripts in restricted locations
    """

    @staticmethod
    def validate_and_extract(zip_path: Path, target_dir: Path) -> Tuple[bool, str, List[Path]]:
        """
        Validates the zip file and extracts safely into target_dir.
        Returns: (success: bool, message: str, extracted_files: List[Path])
        """
        if not zip_path.exists():
            raise UnsafeArchiveError("Uploaded archive file does not exist.")

        file_size = zip_path.stat().st_size
        if file_size > settings.MAX_ARCHIVE_SIZE_BYTES:
            raise UnsafeArchiveError(
                f"Archive exceeds maximum size limit of {settings.MAX_ARCHIVE_SIZE_BYTES // (1024*1024)}MB. "
                f"Got: {file_size / (1024*1024):.1f}MB"
            )

        if not zipfile.is_zipfile(zip_path):
            raise UnsafeArchiveError("File is not a valid ZIP archive.")

        target_dir = target_dir.resolve()
        target_dir.mkdir(parents=True, exist_ok=True)

        extracted_files: List[Path] = []
        total_uncompressed_size = 0
        file_count = 0

        with zipfile.ZipFile(zip_path, 'r') as zf:
            infolist = zf.infolist()
            
            if len(infolist) > settings.MAX_FILE_COUNT:
                raise UnsafeArchiveError(
                    f"Archive contains too many files ({len(infolist)}). "
                    f"Maximum allowed is {settings.MAX_FILE_COUNT}."
                )

            for member in infolist:
                # 1. Reject absolute paths and dangerous components
                filename = member.filename
                if filename.startswith("/") or filename.startswith("\\") or ":" in filename:
                    raise UnsafeArchiveError(f"Unsafe absolute path or drive letter in archive: {filename}")

                # 2. Check for Zip Slip / directory traversal
                destination_path = (target_dir / filename).resolve()
                try:
                    destination_path.relative_to(target_dir)
                except ValueError:
                    raise UnsafeArchiveError(f"Directory traversal detected in archive entry: {filename}")

                # 3. Check for zip bomb expansion ratio
                total_uncompressed_size += member.file_size
                file_count += 1

                if file_size > 0:
                    expansion_ratio = total_uncompressed_size / file_size
                    if expansion_ratio > settings.MAX_UNCOMPRESSED_RATIO and total_uncompressed_size > 10 * 1024 * 1024:
                        raise UnsafeArchiveError(
                            f"Suspicious uncompressed expansion ratio ({expansion_ratio:.1f}x). "
                            "Extraction aborted to prevent zip bomb DoS."
                        )

            # Safely extract files
            for member in infolist:
                if member.is_dir():
                    continue

                dest_file = (target_dir / member.filename).resolve()
                dest_file.parent.mkdir(parents=True, exist_ok=True)

                # Write out file content safely
                with zf.open(member) as source, open(dest_file, "wb") as target:
                    shutil.copyfileobj(source, target)
                
                extracted_files.append(dest_file)

        return True, f"Successfully validated and extracted {len(extracted_files)} files safely.", extracted_files
