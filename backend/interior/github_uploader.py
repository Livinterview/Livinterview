import subprocess
from pathlib import Path
import shutil
import datetime

def upload_image_to_github(local_image_path: Path) -> str:
    """
    로컬 이미지 파일을 GitHub assets 리포로 복사하고, raw URL을 반환함.
    """

    # 이 코드는 '~/Desktop/assets' 위치에
    # 'Livinterview/assets' GitHub 리포를 clone해둔 상태를 전제로 합니다.
    # git clone https://github.com/Livinterview/assets ~/Desktop/assets
    # 경로를 바꾸고 싶다면 repo_path를 직접 수정하세요.
    repo_path = Path("~/Desktop/assets").expanduser()
    repo_image_path = repo_path / "uploads"

    # 고유한 파일 이름 생성 (중복 방지)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    target_filename = f"staged_{timestamp}.jpg"
    target_path = repo_image_path / target_filename

    # 디렉토리 생성 + 복사
    repo_image_path.mkdir(parents=True, exist_ok=True)
    shutil.copy(local_image_path, target_path)

    # Git add → commit → push
    subprocess.run(["git", "add", str(target_path)], cwd=repo_path, check=True)
    subprocess.run(["git", "commit", "-m", f"chore: upload {target_filename}"], cwd=repo_path, check=True)
    subprocess.run(["git", "push"], cwd=repo_path, check=True)

    # raw.githubusercontent.com URL 생성
    username = "Livinterview"
    repo = "assets"
    branch = "main"
    raw_url = f"https://raw.githubusercontent.com/{username}/{repo}/{branch}/uploads/{target_filename}"

    return raw_url
