from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("diary", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="diaryentry",
            name="personal_note",
            field=models.CharField(blank=True, max_length=2000),
        ),
        migrations.AddField(
            model_name="diaryentry",
            name="symptoms",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
